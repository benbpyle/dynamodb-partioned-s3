import {Bucket} from "aws-cdk-lib/aws-s3";
import {IKey} from "aws-cdk-lib/aws-kms";
import {CfnDatabase, CfnTable} from "aws-cdk-lib/aws-glue";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export interface FirehoseProps {
    bucket: Bucket;
    key: IKey;
    accountId: string;
    transformation: IFunction;
}