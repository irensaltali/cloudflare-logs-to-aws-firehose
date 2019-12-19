import {
  buildMetadataFromHeaders,
  timeStamp
} from "./utils"
const SignV4 = require("./SignV4.js");
var signV4 = new SignV4();

// Batching
const MAX_REQUESTS_PER_BATCH = 100;
let logEventsBatch = [];

// AWS
var Region = "eu-west-1";

async function addToBatch(body) {
  const enrichedBody = body;
  logEventsBatch.push(enrichedBody);
}

async function handleRequest(event) {
  const { request } = event;

  const requestMetadata = buildMetadataFromHeaders(request.headers);
  const t1 = Date.now();
  const response = await fetch(request);
  const originTimeMs = Date.now() - t1;


  const logflareEventBody = {
    timestamp: timeStamp(),
    response: {
      headers: buildMetadataFromHeaders(response.headers),
      origin_time: originTimeMs,
      status_code: response.status,
    },
    request: {
      url: request.url,
      method: request.method,
      headers: requestMetadata,
      cf: request.cf,
    }
  }
    addToBatch(logflareEventBody);
  
  return response;
}

const resetBatch = () => {
  logEventsBatch = [];
}

const postBatch = async () => {

  //AWS
  {
    var date = new Date();
    var uri = new URL('', 'https://firehose.'+Region+'.amazonaws.com');


    let data = "";
    logEventsBatch.forEach(element => {
      data += JSON.stringify(element) + "\n";
    })

    let buff = new Buffer(data);
    let base64data = buff.toString('base64');
    var payloadData = {
      DeliveryStreamName: 'i4io-log-test-2',
      Record: { Data: base64data }
    };

    var payload = JSON.stringify(payloadData);

    var authHeader = signV4.SignFirehosePostPutRecord(date, uri, payload, '<aws-key>', '<aws-secret>', Region);

    const request = {
      method: "POST",
      headers: {
        "host": uri.hostname,
        "x-amz-date": signV4.yyyyMMddTHHmmssZ(date),
        "x-amz-target": "Firehose_20150804.PutRecord",
        "Authorization": authHeader,
        "Content-Type": "application/x-amz-json-1.1",
        "Content-Length": Buffer.byteLength(payload, 'utf8'),
        "Connection": "Keep-Alive"
      },
      body: payload,
    }

    AWSResponse = JSON.stringify(await fetch('https://firehose.eu-west-1.amazonaws.com', request))
  }

  resetBatch()

  return true
}

const logRequests = async event => {
  if (logEventsBatch.length >= MAX_REQUESTS_PER_BATCH) {
    inSend = "true"
    event.waitUntil(postBatch())
  }
  return handleRequest(event)
}

addEventListener("fetch", event => {
  start = new Date().getTime();
  event.passThroughOnException()

  event.respondWith(logRequests(event))
})