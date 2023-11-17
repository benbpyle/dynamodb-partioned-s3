import {Construct} from "constructs";
import {some} from "aws-cdk/lib/tree";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {GoFunction} from "@aws-cdk/aws-lambda-go-alpha";
import {Duration} from "aws-cdk-lib";
import {FunctionProps} from "../types/function-props";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class FunctionConstruct extends Construct {
    private readonly _function: IFunction;

    get function(): IFunction {
        return this._function;
    }

    constructor(scope: Construct, id: string, props: FunctionProps) {
        super(scope, id);

        this._function = new GoFunction(scope, 'TransformFunction', {
            memorySize: 128,
            functionName: "firehose-transformer",
            entry: "src/",
            timeout: Duration.seconds(15),
            environment: {

            }
        })

        this._function.addToRolePolicy(
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
                resources: [props.dataKey.keyArn]
            })
        )
    }
}