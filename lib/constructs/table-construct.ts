import {Construct} from "constructs";
import {TableProps} from "../types/table-props";
import {AttributeType, BillingMode, StreamViewType, Table, TableEncryption} from "aws-cdk-lib/aws-dynamodb";
import {RemovalPolicy} from "aws-cdk-lib";

export default class TableConstruct extends Construct {
    private readonly _table: Table;

    constructor(scope: Construct, id: string, props: TableProps) {
        super(scope, id);

        this._table = new Table(this, id, {
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: {name: "id", type: AttributeType.STRING},
            tableName: `AnalyticsTable`,
            encryption: TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: props.key,
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
        });
    }

    get table(): Table {
        return this._table;
    }
}
