import {Construct} from "constructs";
import {Bucket, BucketEncryption} from "aws-cdk-lib/aws-s3";
import {RemovalPolicy} from "aws-cdk-lib";
import {BucketProps} from "../types/bucket-props";

export class S3Construct extends Construct {
    private readonly _bucket: Bucket;
    constructor(scope: Construct, id: string, props: BucketProps) {
        super(scope, id);

        this._bucket = new Bucket(scope, 'AnalyticsBucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            encryptionKey: props.key,
            encryption: BucketEncryption.KMS
        });
    }

    get bucket(): Bucket {
        return this._bucket;
    }
}