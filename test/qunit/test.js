/* global QUnit */
'use strict';

const fetch = require('node-fetch');
const Ajv = require('ajv');
const LOCAL_API = 'http://localhost:8080/api';
const TEST_API = 'http://jacekkopecky.myvm.port.ac.uk/api';
const TEST_USER = 'hartmut.blank@port.ac.uk';
const TEST_METAANALYSES = 'MisinformationEffect';
const TEST_PAPER = 'LiveVideo';

/* --------------------------------- Schemas -------------------------------- */

const profileSchema = require('../schemas/profile');
const userPapersSchema = require('../schemas/user-papers');
const paperTitleSchema = require('../schemas/paper-title');
const ajv = new Ajv();

/* -------------------------------------------------------------------------- */
/*                                  test data                                 */
/* -------------------------------------------------------------------------- */

const profileTestData = require('./snapshots/profile.json');
// const commentTestData = require('./snapshots/comments.json');
const paperTestData = require('./snapshots/user_papers.json');
const paperTitleTestData = require('./snapshots/paper-title.json');
const metaanalysesTestData = require('./snapshots/metaanalyses.json');
const metaanalysesTitleTestData = require('./snapshots/metaanalyses-title.json');


/* -------------------------------------------------------------------------- */
/*                               Fetch Functions                              */
/* -------------------------------------------------------------------------- */

async function getProfile(url, username) {
  const req = await fetch(`${url}/profile/${username}`);
  const res = await req.json();
  return res;
}

async function getPapers(url, username) {
  const req = await fetch(`${url}/papers/${username}`);
  const res = await req.json();
  return res;
}

async function getPaperByTitle(url, username, title) {
  const req = await fetch(`${url}/papers/${username}/${title}`);
  const res = await req.json();
  return res;
}

async function getMetaanalyses(url, username) {
  const req = await fetch(`${url}/metaanalyses/${username}`);
  const res = await req.json();
  return res;
}

async function getMetaanlysisByTitle(url, username, title) {
  const req = await fetch(`${url}/metaanalyses/${username}/${title}`);
  const res = await req.json();
  return res;
}

/* -------------------------------------------------------------------------- */
/*                                Test Helpers                                */
/* -------------------------------------------------------------------------- */

function testSinglePaper(assert, paper) {
  // todo: maybe check data types?
  assert.ok(paper.id, 'Check that the paper has an id');
  assert.ok(paper.title, 'Check that the paper has a title');
  assert.ok(paper.enteredBy, 'Check that the paper has a enteredBy field');
  assert.ok(paper.ctime, 'Check that the paper has a ctime');
  assert.ok(paper.mtime, 'Check that the paper has a mtime');
  // assert.ok(paper.reference, 'Check that the paper has a reference');
  assert.ok(Array.isArray(paper.tags), 'Check that the paper has a an array of tags');
  assert.ok(paper.apiurl, 'Check that the paper has a id');
}

function testSingleMetaanalysis(assert, metaanalysis) {
  // console.log(metaanalysis)
  // todo: maybe check data types?
  assert.ok(metaanalysis.id, 'Check the metaanlysis has an ID');
  assert.ok(metaanalysis.title, 'Check the metaanlysis has a title');
  assert.ok(metaanalysis.enteredBy, 'Check the metaanlysis has an entered by name');
  assert.ok(metaanalysis.ctime, 'Check the metaanlysis has a ctime');
  assert.ok(metaanalysis.mtime, 'Check the metaanlysis has an mtime');
  // assert.ok(metaanalysis.published, 'Check the metaanlysis has a published field');
  // assert.ok(metaanalysis.description, 'Check the metaanlysis has a description');
  assert.ok(metaanalysis.columns, 'Check the metaanlysis has columns');
  assert.ok(metaanalysis.paperOrder, 'Check the metaanlysis has a paper order');
  assert.ok(metaanalysis.hiddenCols, 'Check the metaanlysis has hidden columns');
  // assert.ok(metaanalysis.hiddenExperiments, 'Check the metaanlysis has hidden experiments');
  assert.ok(metaanalysis.excludedExperiments, 'Check the metaanlysis has exclued experiments');
  assert.ok(metaanalysis.aggregates, 'Check the metaanlysis has aggregates');
}
/* -------------------------------------------------------------------------- */
/*                     Tests to check against old version                     */
/* -------------------------------------------------------------------------- */

QUnit.module('API Comparison')

QUnit.test('Get user profile', async assert => {
  const req1 = await getProfile(LOCAL_API, TEST_USER);
  assert.deepEqual(req1, profileTestData, 'The body should be the same');
});

QUnit.test('Get papers from a specific user', async assert => {
  const req1 = await getPapers(LOCAL_API, TEST_USER);
  assert.deepEqual(req1, paperTestData, 'The body should be the same');
});

QUnit.test('Get a paper by title', async assert => {
  const req1 = await getPaperByTitle(LOCAL_API, TEST_USER, TEST_PAPER);
  assert.deepEqual(req1, paperTitleTestData, 'The body should be the same');
});

QUnit.test('Get all metaanalysis by a user', async assert => {
  const req1 = await getMetaanalyses(LOCAL_API, TEST_USER);
  const req2 = await getMetaanalyses(TEST_API, TEST_USER);
  assert.deepEqual(req1, metaanalysesTestData, 'The body should be the same');
});

QUnit.test('Get a metaanalysis by title', async assert => {
  const req1 = await getMetaanlysisByTitle(LOCAL_API, TEST_USER, TEST_METAANALYSES);
  assert.deepEqual(req1, metaanalysesTitleTestData, 'The body should be the same');
});


/* -------------------------------------------------------------------------- */
/*                       Test to check structure of data                      */
/* -------------------------------------------------------------------------- */
QUnit.module('Structure Test');

QUnit.test('Check the structure of the user', async assert => {
  const user = await getProfile(LOCAL_API, TEST_USER);
  const validate = ajv.compile(profileSchema);
  const valid = validate(user);
  assert.ok(valid, 'Check the structure of the user matches the schema');
});

QUnit.test('Check the structure of the papers', async assert => {
  const papers = await getPapers(LOCAL_API, TEST_USER);
  const validate = ajv.compile(userPapersSchema);
  const valid = validate(papers);
  assert.ok(valid, 'Check the structure of the papers matches the schema')
});

QUnit.test('Check the structure of a specific paper', async assert => {
  const paper = await getPaperByTitle(LOCAL_API, TEST_USER, TEST_PAPER);
  testSinglePaper(assert, paper);
});

QUnit.test('Check the strucutre of the metaanalysis', async assert => {
  const metaanalyses = await getMetaanalyses(LOCAL_API, TEST_USER);
  metaanalyses.forEach(meta => testSingleMetaanalysis(assert, meta));
});

QUnit.test('Check the strucutre of the metaanalysis for specific title', async assert => {
  const metaanalysis = await getMetaanlysisByTitle(LOCAL_API, TEST_USER, TEST_METAANALYSES);  
  testSingleMetaanalysis(assert, metaanalysis);
});


// { "id": "/id/p/1591873074600", "title": "paper-new", "enteredBy": "up932006@myport.ac.uk", "ctime": 1591873074600, "mtime": 1591873074600, "tags": [], "apiurl": "/api/papers/up932006/paper-new", "experiments": [{ "title": "exp", "data": { "1": { "value": "10", "enteredBy": "up932006@myport.ac.uk", "ctime": 1591873074602 } }, "enteredBy": "up932006@myport.ac.uk", "ctime": 1591873074601 }], "columns": [{ "id": "1", "title": "col", "type": "characteristic" }], "hiddenCols": [] }
// { "id": "/id/ma/1591873074809", "title": "testing123", "enteredBy": "up932006@myport.ac.uk", "ctime": 1591873074809, "mtime": 1591873074809, "tags": [], "columns": [{ "id": "1", "title": "col", "type": "characteristic", "sourceColumnMap": { "new_paper_1591873012770": "1" } }], "paperOrder": ["/id/p/1591873074600"], "hiddenCols": [], "hiddenExperiments": [], "excludedExperiments": [], "aggregates": [], "groupingAggregates": [], "graphs": [], "apiurl": "/api/metaanalyses/up932006/testing123" }