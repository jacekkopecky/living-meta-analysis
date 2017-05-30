'use strict';

// normal logging goes to stderr
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

function log(e) {
  console.error(e && e.stack || e);
}

let storage;
let data;

inputData
.catch(() => process.exit(1))
.then((d) => {
  data = d;
  storage = require('./storage'); // eslint-disable-line global-require
  return storage.ready;
})
.then(() => {
  let promises = [];

  if ('users' in data) {
    for (const userID of Object.keys(data.users)) {
      promises.push(storage.saveUser(userID, data.users[userID]));
    }
  }

  promises = promises.map((promise) => promise.catch(log));
  console.log(`ready to process ${promises.length} users`);
  return Promise.all(promises);
})
.then(() => {
  let promises = [];

  if ('columns' in data) {
    for (const colId of Object.keys(data.columns)) {
      promises.push(storage.saveColumn(data.columns[colId], null, { restoring: true }));
    }
  }

  promises = promises.map((promise) => promise.catch(log));
  console.log(`ready to process ${promises.length} columns`);
  return Promise.all(promises);
})
.then(() => {
  let promises = [];

  if ('papers' in data) {
    for (const paper of data.papers) {
      promises.push(storage.savePaper(paper, null, null, { restoring: true }));
    }
  }

  promises = promises.map((promise) => promise.catch(log));
  console.log(`ready to process ${promises.length} papers`);
  return Promise.all(promises);
})
.then(() => {
  let promises = [];

  if ('metaanalyses' in data) {
    for (const metaanalysis of data.metaanalyses) {
      promises.push(storage.saveMetaanalysis(metaanalysis, null, null, { restoring: true }));
    }
  }

  promises = promises.map((promise) => promise.catch(log));
  console.log(`ready to process ${promises.length} metaanalyses`);
  return Promise.all(promises);
})
.then(() => console.log('all done'))
.catch((e) => console.error('error saving: ', e && e.stack || e));
