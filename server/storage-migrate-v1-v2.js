/*
 * migrates from v1 with Articles to v2 with Papers
 */

'use strict';

const gcloud = require('gcloud')({
  projectId: 'jacek-soc-port-ac-uk',
  keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
});

const v1 = 'living-meta-analysis-v1';
const v2 = 'living-meta-analysis-v2';

const datastorev1 = gcloud.datastore({ namespace: v1 });
const datastorev2 = gcloud.datastore({ namespace: v2 });


// get all users immediately on the start of the server
migrateAllUsers();

function migrateAllUsers() {
  console.log('migrating all users');
  let count = 0;
  let finished = false;
  datastorev1.createQuery('User').run()
  .on('error', (err) => {
    console.error('error retrieving v1 users');
    console.error(err);
  })
  .on('data', (entity) => {
    console.log('  user ' + entity.key.name);

    entity.key.namespace = v2;
    count++;
    datastorev2.save({
      key: entity.key,
      data: entity.data,
    }, (err) => {
      if (err) {
        console.error('error saving user ' + entity.key.name);
        console.error(err);
      } else {
        console.log('  success user ' + entity.key.name);
      }
      count--;
      if (finished && count === 0) {
        console.log('done migrating all users');
        migrateAllArticlesToPapers();
      }
    });
  })
  .on('end', () => {
    finished = true;
  });
}

function migrateAllArticlesToPapers() {
  console.log('migrate all articles to papers');
  let count = 0;
  let finished = false;
  datastorev1.createQuery('Article').run()
  .on('error', (err) => {
    console.error('error retrieving v1 articles');
    console.error(err);
  })
  .on('data', (entity) => {
    console.log('  article ' + entity.key.name);

    entity.key.namespace = v2;
    entity.key.kind = 'Paper';
    entity.key.name = '/id/p/' + entity.key.name.substring(6);
    entity.data.id = '/id/p/' + entity.data.id.substring(6);
    count++;
    datastorev2.save({
      key: entity.key,
      data: entity.data,
    }, (err) => {
      if (err) {
        console.error('error saving article ' + entity.key.name);
        console.error(err);
      } else {
        console.log('  success article ' + entity.key.name);
      }
      count--;
      if (finished && count === 0) {
        console.log('done migrating all articles to papers');
        migrateAllArticleLogEntriesToPapersLog();
      }
    });
  })
  .on('end', () => {
    finished = true;
  });
}

function migrateAllArticleLogEntriesToPapersLog() {
  console.log('migrate all article log entries to papers log');
  let count = 0;
  let finished = false;
  datastorev1.createQuery('ArticleLog').run()
  .on('error', (err) => {
    console.error('error retrieving v1 article log entries');
    console.error(err);
  })
  .on('data', (entity) => {
    console.log('  article log entry ' + entity.key.name);

    entity.key.namespace = v2;
    entity.key.kind = 'PaperLog';
    entity.key.name = '/id/p/' + entity.key.name.substring(6);

    entity.key.parent.namespace = v2;
    entity.key.parent.kind = 'Paper';
    entity.key.parent.name = '/id/p/' + entity.key.parent.name.substring(6);

    entity.data.paper = entity.data.article;
    delete entity.data.article;

    entity.data.paper.id = '/id/p/' + entity.data.paper.id.substring(6);

    count++;
    datastorev2.save({
      key: entity.key,
      data: [
        { name: 'mtime',
          value: entity.data.mtime },
        { name: 'enteredBy',
          value: entity.data.enteredBy },
        { name: 'paper',
          value: entity.data.paper,
          excludeFromIndexes: true },
      ],
    }, (err) => {
      if (err) {
        console.error('error saving paper log entry ' + entity.key.name);
        console.error(err);
      } else {
        console.log('  success paper log entry' + entity.key.name);
      }
      count--;
      if (finished && count === 0) {
        console.log('done migrating all article log entries to papers log');
      }
    });
  })
  .on('end', () => {
    finished = true;
  });
}
