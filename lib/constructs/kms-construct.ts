import {Construct} from "constructs";
import {Fn} from "aws-cdk-lib";
import {IKey, Key} from "aws-cdk-lib/aws-kms";

export class KmsConstruct extends Construct {
    private readonly _dataKey: IKey;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        this._dataKey =  new Key(scope, 'KmsKey', {
            description: 'Key for DDB Glue Analytics'
        })
    }


    get dataKey(): IKey {
        return this._dataKey;
    }
}