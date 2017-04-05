'use strict';

// normal logging goes to stderr
const log = console.log;
console.log = console.error;

const storage = require('./storage');

const data = {};

storage.ready
.then(storage.listUsers)
.then((d) => { data.users = d; })
.then(storage.listPapers)
.then((d) => { data.papers = d; })
.then(storage.listMetaanalyses)
.then((d) => { data.metaanalyses = d; })
.then(storage.listColumns)
.then((d) => { data.columns = d; })
.then(() => {
  console.error('storage-dump done');
  log(JSON.stringify(data, null, 2));
});
