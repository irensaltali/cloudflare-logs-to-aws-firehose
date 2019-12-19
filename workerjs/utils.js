const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const buildMetadataFromHeaders = headers => {
  const responseMetadata = {}
  Array.from(headers).forEach(([key, value]) => {
    responseMetadata[key.replace(/-/g, "_")] = value
  })
  return responseMetadata
}

const timeStamp = () => {
  var now =new Date();
  var y = now.getUTCFullYear();
  var M = now.getUTCMonth() + 1;
  var d = now.getUTCDate();
  var h = now.getUTCHours();
  var m = now.getUTCMinutes();
  var s = now.getUTCSeconds();
  var MM = M < 10 ? '0' + M : M;
  var dd = d < 10 ? '0' + d : d;
  var hh = h < 10 ? '0' + h : h;
  var mm = m < 10 ? '0' + m : m;
  var ss = s < 10 ? '0' + s : s;
  //AWS Athena compatible timestamp
  return '' + y + '-' + MM + '-' + dd + ' ' + hh + ':' + mm + ':' + ss;
}

export { sleep, buildMetadataFromHeaders, timeStamp }