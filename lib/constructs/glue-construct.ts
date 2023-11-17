import {Construct} from "constructs";
import {GlueProps} from "../types/glue-props";
import {CfnCrawler, CfnDatabase, CfnTable} from "aws-cdk-lib/aws-glue";
import {Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class GlueConstruct extends Construct {
    private readonly _database: CfnDatabase;
    private readonly _table: CfnTable;

    get database(): CfnDatabase {
        return this._database;
    }

    get table(): CfnTable {
        return this._table;
    }

    constructor(scope: Construct, id: string, props: GlueProps) {
        super(scope, id);

        const dbName = "analytics";
        const tableName = "sample-table";

        this._database = new CfnDatabase(scope, "GlueDatabase", {
            catalogId: props.account,
            databaseInput: {
                description: "DB for holding tables",
                name: dbName
            }
        });

        this._table = new CfnTable(scope, 'GlueTable', {
            databaseName: dbName,
            tableInput: {
                description: "Table for analytics",
                name: tableName,
                // partitionKeys: [
                //     {
                //         type: 'string',
                //         name: 'siteId'
                //     },
                //     {
                //         type: 'int',
                //         name: 'year'
                //     },
                //     {
                //         type: 'int',
                //         name: 'month'
                //     },
                //     {
                //         type: 'int',
                //         name: 'day'
                //     },
                //     {
                //         type: 'int',
                //         name: 'minute'
                //     },
                // ],
                parameters: {
                    classification: "json"
                },
                storageDescriptor: {
                    location: `s3://${props.bucket.bucketName}/data`,
                    columns: [
                        {
                            type: 'int',
                            name: 'id'
                        },
                        {
                            type: 'string',
                            name: "name"
                        },
                        {
                            type: 'int',
                            name: 'valueOne'
                        },
                        {
                            type: 'int',
                            name: 'valueTwo'
                        },
                        {
                            type: 'date',
                            name: 'createdAtTime'
                        },

                    ],
                    inputFormat: "org.apache.hadoop.mapred.TextInputFormat",

                    outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
                    serdeInfo: {
                        serializationLibrary: "org.openx.data.jsonserde.JsonSerDe"
                    },
                },
            },
            catalogId: props.account
        })


        const servicePrincipal = new ServicePrincipal("glue.amazonaws.com", {})

        const bucketPolicy = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    sid: "S3BucketPolicy",
                    actions: ["s3:*"],
                    effect: Effect.ALLOW,
                    resources: [
                        `${props.bucket.bucketArn}*`]
                })
            ]
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


        const glueRole = new Role(scope, 'GlueRole', {
            assumedBy: servicePrincipal,
            managedPolicies: [
                ManagedPolicy.fromManagedPolicyArn(scope, 'GlueServicePolicy', 'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole')
            ],
            inlinePolicies: {
                dataBucketPolicy: bucketPolicy,
                kmsEncryptionPolicy: kmsPolicy
            }
        });

        // const crawler = new CfnCrawler(scope, 'GlueCrawler', {
        //     databaseName: dbName,
        //     description: "Analytics crawler",
        //     role: glueRole.roleArn,
        //
        //     targets: {
        //         catalogTargets: [{
        //             databaseName: dbName,
        //             // dlqEventQueueArn: 'dlqEventQueueArn',
        //             // eventQueueArn: 'eventQueueArn',
        //             // tables: [tableName],
        //
        //         }]
        //     },
        //     // schedule: {
        //     //     scheduleExpression: "cron(*/30 * * * ? *)"
        //     // },
        //     schemaChangePolicy: {
        //         deleteBehavior: "LOG"
        //     }
        // })

    }
}