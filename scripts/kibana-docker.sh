#!/bin/bash

exec docker run \
  --rm \
  -e ELASTICSEARCH_URL="http://opensearch:9200" \
  -p 5601:5601 \
  --network=elastic \
  docker.elastic.co/kibana/kibana:7.0.0
