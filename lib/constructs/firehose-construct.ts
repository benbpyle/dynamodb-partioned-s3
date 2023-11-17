import {Construct} from "constructs";
import {FirehoseProps} from "../types/firehose-props";
import {
    Effect,
    PolicyDocument,
    PolicyStatement,
    PrincipalWithConditions,
    Role,
    ServicePrincipal
} from "aws-cdk-lib/aws-iam";
import {CfnDeliveryStream} from "aws-cdk-lib/aws-kinesisfirehose";


export class FirehoseConstruct extends Construct {
    private readonly _firehose: CfnDeliveryStream

    get firehose(): CfnDeliveryStream {
        return this._firehose;
    }

    constructor(scope: Construct, id: string, props: FirehoseProps) {
        super(scope, id);

        const lambdaPolicy = new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        resources: [
                            props.transformation.functionArn
                        ],
                        actions: [
                            'lambda:InvokeFunction',
                            'lambda:GetFunctionConfiguration',
                        ]
                    })]
            }
        );

        const bucketPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: [
                        props.bucket.bucketArn,
                        `${props.bucket.bucketArn}*`
                    ],
                    actions: [
                        's3:AbortMultipartUpload',
                        's3:GetBucketLocation',
                        's3:GetObject',
                        's3:ListBucket',
                        's3:ListBucketMultipartUploads',
                        's3:PutObject'
                    ]
                })]
        });

        const kmsPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    sid: "KMSPolicy",
                    actions: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*"
                    ],
                    effect: Effect.ALLOW,
                    resources: [props.key.keyArn]
                })
            ]
        })

        const assumedBy = new ServicePrincipal("firehose.amazonaws.com");
        const role = new Role(scope, 'DeliveryS3Role', {
            assumedBy: new PrincipalWithConditions(assumedBy, {
                StringEquals: {
                    "aws:SourceAccount": props.accountId,
                },
                // sts:ExternalId
            }),
            inlinePolicies: {
                bucketPolicy: bucketPolicy,
                kmsPolicy: kmsPolicy,
                lambdaPolicy: lambdaPolicy
            },
        });

        this._firehose = new CfnDeliveryStream(scope, 'DeliveryStream', {
            deliveryStreamName: "analytics",
            deliveryStreamType: 'DirectPut',
            deliveryStreamEncryptionConfigurationInput: {
                keyArn: props.key.keyArn,
                keyType: "CUSTOMER_MANAGED_CMK"
            },
            extendedS3DestinationConfiguration: {
                bucketArn: props.bucket.bucketArn,
                bufferingHints: {
                    intervalInSeconds: 60,
                    sizeInMBs: 128
                },
                encryptionConfiguration: {
                    kmsEncryptionConfig: {
                        awskmsKeyArn: props.key.keyArn
                    }
                },
                roleArn: role.roleArn,
                prefix: 'data/siteId=!{partitionKeyFromLambda:siteId}/year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/minute=!{partitionKeyFromLambda:minute}/',
                errorOutputPrefix: 'errors/',
                dynamicPartitioningConfiguration: {
                    enabled: true,
                },
                processingConfiguration: {
                    enabled: true,
                    processors: [{
                        type: "Lambda",
                        parameters: [
                            {
                                parameterName: "LambdaArn",
                                parameterValue: props.transformation.functionArn
                            },
                        ]
                    }]
                },

            }
        });
    }
}