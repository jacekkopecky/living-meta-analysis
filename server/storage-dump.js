'use strict';

// send stdout to stderr, but in the end send the data to stdout
const log = console.log;
console.log = console.error;

const storageTools = require('./lib/storage-tools');

// normal logging goes to stderr
async function storageDump() {
  try {
    const thing = await storageTools.dump();
    console.log('storage-dump done');
    log(JSON.stringify(thing, null, 2));
    process.exit();
  } catch (e) {
    console.error('error dumping: ', e && e.stack || e);
    throw e;
  }
}

storageDump();