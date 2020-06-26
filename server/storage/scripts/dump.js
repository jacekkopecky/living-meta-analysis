'use strict';

// send stdout to stderr, but in the end send the data to stdout
const log = console.log;

const storageTools = require('../../lib/storage-tools');

// normal logging goes to stderr
async function storageDump() {
  try {
    const data = await storageTools.dump();
    console.error('storage-dump done');
    log(JSON.stringify(data, null, 2));
    process.exit();
  } catch (e) {
    console.error('error dumping: ', e.stack || e);
    throw e;
  }
}

storageDump();
