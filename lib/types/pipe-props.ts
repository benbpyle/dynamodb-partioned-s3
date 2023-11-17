import { Table } from "aws-cdk-lib/aws-dynamodb";
import {IKey, Key} from "aws-cdk-lib/aws-kms";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import {CfnDeliveryStream} from "aws-cdk-lib/aws-kinesisfirehose";

export interface PipeProps {
    key: IKey;
    table: Table;
    firehose: CfnDeliveryStream
}
