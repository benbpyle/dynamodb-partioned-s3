import {CfnPipe} from "aws-cdk-lib/aws-pipes";
import {Construct} from "constructs";
import {PipeProps} from "../types/pipe-props";
import {Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal,} from "aws-cdk-lib/aws-iam";
import {Key} from "aws-cdk-lib/aws-kms";
import {Table} from "aws-cdk-lib/aws-dynamodb";
import {Stack} from "aws-cdk-lib";

export class TransformPipeConstruct extends Construct {
    constructor(scope: Construct, id: string, props: PipeProps) {
        super(scope, id);

        const accountId = Stack.of(this).account;
        const region = Stack.of(this).region;
        // Create the role
        const pipeRole = this.pipeRole(
            scope,
            this.sourcePolicy(props.key as Key, props.table),
            this.targetPolicy(props)
        );

        const pipe = new CfnPipe(scope, "Pipe", {
            name: "Ddb-Stream-Firehose-Pipe",
            roleArn: pipeRole.roleArn,
            source: props.table.tableStreamArn!,
            target: props.firehose.attrArn,
            targetParameters: {
                inputTemplate: '{ "createdAtTime": "<$.dynamodb.NewImage.createdAtTime.N>", "siteId": "<$.dynamodb.NewImage.siteId.S>", "id": "<$.dynamodb.NewImage.id.S>", "name": "<$.dynamodb.NewImage.name.S>", "valueOne": "<$.dynamodb.NewImage.valueOne.N>", "valueTwo": "<$.dynamodb.NewImage.valueTwo.N>" }'
            },
            sourceParameters: this.sourceParameters(),
        });
    }

    targetPolicy = (props: PipeProps): PolicyDocument => {
        return new PolicyDocument({
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
                    }),
                    new PolicyStatement({
                        sid: "FirehosePolicy",
                        actions: [
                            "firehose:DeleteDeliveryStream",
                            "firehose:PutRecord",
                            "firehose:PutRecordBatch",
                            "firehose:UpdateDestination"
                        ],
                        effect: Effect.ALLOW,
                        resources: [props.firehose.attrArn]
                    })
                ]
            }
        )

    };

    sourcePolicy = (key: Key, table: Table): PolicyDocument => {
        return new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        "dynamodb:DescribeStream",
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:ListStreams",
                    ],
                    effect: Effect.ALLOW,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    resources: [table.tableStreamArn!],
                }),
                new PolicyStatement({
                    actions: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    resources: [key.keyArn],
                    effect: Effect.ALLOW,
                }),
            ],
        });
    };

    pipeRole = (
        scope: Construct,
        sourcePolicy: PolicyDocument,
        targetPolicy: PolicyDocument
    ): Role => {
        return new Role(scope, "PipeRole", {
            assumedBy: new ServicePrincipal("pipes.amazonaws.com"),
            inlinePolicies: {
                sourcePolicy,
                targetPolicy
            },
        });
    };

    sourceParameters = () => {
        return {
            dynamoDbStreamParameters: {
                startingPosition: "LATEST",
                batchSize: 10,
            },
            filterCriteria: {
                filters: [
                    {
                        pattern: ' { "eventName": [ "MODIFY", "INSERT" ] }',
                    },
                ],
            },
        };
    };

}
