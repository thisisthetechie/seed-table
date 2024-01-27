#!/usr/bin/env node

const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { STS } = require('@aws-sdk/client-sts');

const fs = require('fs');
const path = require('path');

seedTable();

async function seedTable() {
  const sts = new STS();
  sts.assumeRole(
    {
      RoleArn: process.argv[4],
      RoleSessionName: process.env.HOSTNAME,
    },
    async function (err, data) {
      if (err) {
        console.log('Cannot assume role');
        console.log(err, err.stack);
      } else {
        const newCreds = data['Credentials'];
        const dbClient = DynamoDBDocument.from(new DynamoDB({
          region: 'eu-west-1',
          accessKeyId: newCreds['AccessKeyId'],
          secretAccessKey: newCreds['SecretAccessKey'],
          sessionToken: newCreds['SessionToken'],
        }));

        const tableName = process.argv[2];
        const resourceLocation = process.argv[3];

        const resource = JSON.parse(
          fs.readFileSync(path.resolve(__dirname, resourceLocation)),
        );
        let batches = [];

        while (resource.length > 0) {
          batches.push(resource.splice(0, 25));
        }

        for (const batch of batches) {
          let query = {
            RequestItems: {},
          };
          query.RequestItems[tableName] = [];

          for (const item of batch) {
            try {
              if (item['testStationEmails']) {
                item['testStationEmails'] = [
                  'automation@nonprod.cvs.dvsacloud.uk',
                ];
              }
            } catch (e) {
              // Ignore non-test stations files
            }
            query.RequestItems[tableName].push({
              PutRequest: {
                Item: item,
              },
            });
          }

          dbClient
            .batchWrite(query)
            .then((result) => {
              console.info(JSON.stringify(result));
            })
            .catch((error) => {
              console.error(JSON.stringify(error));
            });

          await sleep(100);
        }
      }
    },
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

