import {Bucket} from "aws-cdk-lib/aws-s3";
import {IKey} from "aws-cdk-lib/aws-kms";

export interface GlueProps {
    account: string;
    bucket: Bucket;
    key: IKey;
}