'use strict';

function log(e) {
  console.error(e && e.stack || e);
}

const storage = require('./../storage');

module.exports.add = (data) => {
  return storage.init()
  .then(() => {
    let promises = [];

    if ('users' in data) {
      for (const userID of Object.keys(data.users)) {
        promises.push(storage.saveUser(userID, data.users[userID], { restoring: true }));
      }
    }

    // just log any failures
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

    // just log any failures
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

    // just log any failures
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

    // just log any failures
    promises = promises.map((promise) => promise.catch(log));
    console.log(`ready to process ${promises.length} metaanalyses`);
    return Promise.all(promises);
  });
};

module.exports.dump = () => {
  const data = {};

  return storage.init()
  .then(storage.listUsers)
  .then((d) => { data.users = d; })
  .then(storage.listPapers)
  .then((d) => { data.papers = d; })
  .then(storage.listMetaanalyses)
  .then((d) => { data.metaanalyses = d; })
  .then(storage.listColumns)
  .then((d) => { data.columns = d; })
  .then(() => data);
};

module.exports.migrate = (data) => {
  if (data.users) {
    Object.keys(data.users).forEach((email) => {
      storage.migrateUser(data.users[email]);
    });
  }
  if (data.papers) {
    data.papers.forEach((paper) => {
      storage.migratePaper(paper, data.columns);
    });
  }
  if (data.metaanalyses) {
    data.metaanalyses.forEach((metaanalysis) => {
      storage.migrateMetaanalysis(metaanalysis, data.papers, data.columns);
    });
  }
  delete data.columns;
  return data;
};
