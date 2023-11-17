package main

import (
	"context"
	"encoding/json"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	log "github.com/sirupsen/logrus"
	"strconv"
)

func init() {
	log.SetFormatter(&log.JSONFormatter{PrettyPrint: false})
	log.SetLevel(log.DebugLevel)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, firehose events.KinesisFirehoseEvent) (events.KinesisFirehoseResponse, error) {
	log.WithFields(log.Fields{
		"event": firehose,
	}).Debugf("Printing out the event")

	response := events.KinesisFirehoseResponse{}

	for _, r := range firehose.Records {
		var transformedRecord events.KinesisFirehoseResponseRecord
		transformedRecord.RecordID = r.RecordID
		transformedRecord.Result = events.KinesisFirehoseTransformedStateOk
		transformedRecord.Data = r.Data

		var metaData events.KinesisFirehoseResponseRecordMetadata
		var recordData Model
		partitionKeys := make(map[string]string)

		//currentTime := time.Now()
		err := json.Unmarshal(r.Data, &recordData)
		if err != nil {
			log.WithFields(log.Fields{
				"err":      err,
				"recordID": r.RecordID,
			}).Error("Error unmarshalling the record")
			transformedRecord.Result = "ProcessingFailed"
			response.Records = append(response.Records, transformedRecord)
			continue
		}

		partitionKeys["siteId"] = recordData.SiteId
		partitionKeys["year"] = strconv.Itoa(recordData.CreatedAtTime.Year())
		partitionKeys["month"] = strconv.Itoa(int(recordData.CreatedAtTime.Month()))
		partitionKeys["day"] = strconv.Itoa(recordData.CreatedAtTime.Day())
		partitionKeys["hour"] = strconv.Itoa(recordData.CreatedAtTime.Hour())
		partitionKeys["minute"] = strconv.Itoa(recordData.CreatedAtTime.Minute())
		metaData.PartitionKeys = partitionKeys
		transformedRecord.Metadata = metaData

		log.WithFields(log.Fields{
			"response": transformedRecord,
			"recordID": r.RecordID,
		}).Debugf("Adding to the results")

		response.Records = append(response.Records, transformedRecord)
	}

	return response, nil
}
