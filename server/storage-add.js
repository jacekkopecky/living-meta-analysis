'use strict';

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
  return storageTools.add(data);
})
.then(() => {
  console.log('all done');
  process.exit();
})
.catch((e) => console.error('error saving: ', e && e.stack || e));
