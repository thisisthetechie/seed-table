#!/usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 494:
/***/ ((module) => {

module.exports = eval("require")("@aws-sdk/client-dynamodb");


/***/ }),

/***/ 114:
/***/ ((module) => {

module.exports = eval("require")("@aws-sdk/client-sts");


/***/ }),

/***/ 480:
/***/ ((module) => {

module.exports = eval("require")("@aws-sdk/lib-dynamodb");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

const { DynamoDBDocument } = __nccwpck_require__(480);
const { DynamoDB } = __nccwpck_require__(494);
const { STS } = __nccwpck_require__(114);

const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);

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


})();

module.exports = __webpack_exports__;
/******/ })()
;