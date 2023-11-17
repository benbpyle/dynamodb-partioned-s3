import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {S3Construct} from "./constructs/s3-construct";
import {FirehoseConstruct} from "./constructs/firehose-construct";
import {KmsConstruct} from "./constructs/kms-construct";
import {GlueConstruct} from "./constructs/glue-construct";
import {TransformPipeConstruct} from "./constructs/transform-pipe-construct";
import TableConstruct from "./constructs/table-construct";
import {FunctionConstruct} from "./constructs/function-construct";

export class DdbPartitionedS3Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const kmsConstruct = new KmsConstruct(this, 'KmsConstruct');
        const bucketConstruct = new S3Construct(this, 'S3Construct', {
            key: kmsConstruct.dataKey
        });

        const tableConstruct = new TableConstruct(this, 'TableConstruct', {
            key: kmsConstruct.dataKey
        });

        const functionConstruct = new FunctionConstruct(this, 'FunctionConstruct', {
            dataKey: kmsConstruct.dataKey
        });

        const firehoseConstruct = new FirehoseConstruct(this, 'FirehoseConstruct', {
            bucket: bucketConstruct.bucket,
            accountId: this.account,
            key: kmsConstruct.dataKey,
            transformation: functionConstruct.function
        });

        const pipeConstruct = new TransformPipeConstruct(this, 'TransformPipeConstruct', {
            key: kmsConstruct.dataKey,
            firehose: firehoseConstruct.firehose,
            table: tableConstruct.table
        })
    }
}
