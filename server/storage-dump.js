'use strict';

// send stdout to stderr, but in the end send the data to stdout
const log = console.log;
console.log = console.error;

const storageTools = require('./lib/storage-tools');

// normal logging goes to stderr

storageTools.dump()
.then((data) => {
  console.error('storage-dump done');
  log(JSON.stringify(data, null, 2));
  process.exit();
})
.catch((e) => console.error('error dumping: ', e && e.stack || e));
