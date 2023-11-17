import {IKey} from "aws-cdk-lib/aws-kms";

export interface FunctionProps {
    dataKey: IKey;
}