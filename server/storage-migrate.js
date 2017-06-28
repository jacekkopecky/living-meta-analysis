'use strict';

// send stdout to stderr, but in the end send the data to stdout
const log = console.log;
console.log = console.error;

// read JSON from stdin
const inputData = new Promise((resolve, reject) => {
  const stdin = process.stdin;
  const inputChunks = [];

  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (chunk) => { inputChunks.push(chunk); });

  stdin.on('end', () => {
    try {
      resolve(JSON.parse(inputChunks.join('')));
    } catch (e) {
      console.error(e && e.stack || e);
      reject(e);
    }
  });
});

inputData
.catch(() => process.exit(1))
.then((data) => {
  const storageTools = require('./lib/storage-tools'); // eslint-disable-line global-require
  return storageTools.migrate(data);
})
.then((data) => {
  console.error('storage-migrate done');
  log(JSON.stringify(data, null, 2));
  process.exit();
})
.catch((e) => console.error('error migrating: ', e && e.stack || e));

// for more robust migration of old data,
// we'd need to keep the migration code around longer (possibly indefinitely)
// also timestamp data in storage-dump.js so we know which migration code to run
// but the migration code could, when no longer needed in the server, move here from storage.js
