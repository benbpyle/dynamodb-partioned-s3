package main

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"strconv"
	"time"
)

type Model struct {
	Id            string    `json:"id"`
	SiteId        string    `json:"siteId"`
	Name          string    `json:"name"`
	ValueOne      int64     `json:"valueOne"`
	ValueTwo      int64     `json:"valueTwo"`
	CreatedAtTime time.Time `json:"createdAtTime"`
}

func (m *Model) UnmarshalJSON(data []byte) error {
	log.Debugf("Attempting to Unmarshal Model")
	mp := make(map[string]interface{})
	err := json.Unmarshal(data, &mp)
	if err != nil {
		log.Error("Error unmarshalling into base map")
		return err
	}

	if v, ok := mp["id"]; ok {
		idStr := v.(string)
		m.Id = idStr
	}

	if v, ok := mp["siteId"]; ok {
		siteIdStr := v.(string)
		m.SiteId = siteIdStr
	}

	if v, ok := mp["name"]; ok {
		nameStr := v.(string)
		m.Name = nameStr
	}

	if v, ok := mp["valueOne"]; ok {
		valueStr := v.(string)
		n, err := strconv.Atoi(valueStr)
		if err != nil {
			log.Error("Error unmarshalling valueOne")
			return err
		}

		m.ValueOne = int64(n)
	}

	if v, ok := mp["valueTwo"]; ok {
		valueStr := v.(string)
		n, err := strconv.Atoi(valueStr)
		if err != nil {
			log.Error("Error unmarshalling valueTwo")
			return err
		}

		m.ValueTwo = int64(n)
	}

	if v, ok := mp["createdAtTime"]; ok {
		valueStr := v.(string)
		n, err := strconv.Atoi(valueStr)
		if err != nil {
			log.Error("Error unmarshalling createdAtTime")
			return err
		}

		epoch := int64(n)
		m.CreatedAtTime = time.UnixMilli(epoch)
	}

	return nil
}
