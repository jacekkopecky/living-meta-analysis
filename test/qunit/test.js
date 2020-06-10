/* global QUnit */
'use strict';

const fetch = require('node-fetch');
const LOCAL_API = 'http://localhost:8080/api';
const TEST_API = 'http://jacekkopecky.myvm.port.ac.uk/api';
const TEST_USER = 'hartmut.blank@port.ac.uk';
const TEST_METAANALYSES = 'MisinformationEffect';
const TEST_PAPER = 'LiveVideo';

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
  const req2 = await getProfile(TEST_API, TEST_USER);  
  assert.deepEqual(req1, req2, 'The body should be the same');
});

QUnit.test('Get papers from a specific user', async assert => {
  const req1 = await getPapers(LOCAL_API, TEST_USER);
  const req2 = await getPapers(TEST_API, TEST_USER);  
  assert.deepEqual(req1, req2, 'The body should be the same');
});

QUnit.test('Get a paper by title', async assert => {
  const req1 = await getPaperByTitle(LOCAL_API, TEST_USER, TEST_PAPER);
  const req2 = await getPaperByTitle(TEST_API, TEST_USER, TEST_PAPER);
  assert.deepEqual(req1, req2, 'The body should be the same');
});

QUnit.test('Get all metaanalysis by a user', async assert => {
  const req1 = await getMetaanalyses(LOCAL_API, TEST_USER);
  const req2 = await getMetaanalyses(TEST_API, TEST_USER);
  assert.deepEqual(req1, req2, 'The body should be the same');
});

QUnit.test('Get a metaanalysis by title', async assert => {
  const req1 = await getMetaanlysisByTitle(LOCAL_API, TEST_USER, TEST_METAANALYSES);
  const req2 = await getMetaanlysisByTitle(TEST_API, TEST_USER, TEST_METAANALYSES);
  assert.deepEqual(req1, req2, 'The body should be the same');
});


/* -------------------------------------------------------------------------- */
/*                       Test to check structure of data                      */
/* -------------------------------------------------------------------------- */
QUnit.module('Structure Test');

QUnit.test('Check the structure of the user', async assert => {
  const user = await getProfile(LOCAL_API, TEST_USER);
  
  assert.ok(user.displayName, 'Check the user has a display name');
  assert.ok(user.email, 'Check the username');
  assert.ok(Array.isArray(user.photos), 'Check if photos is an array');
  assert.ok(user.photos[0], 'Check if the first element of photos array is not null');
  assert.ok(user.joined, 'Check if the user has a joined date');
  assert.ok(user.username, 'Check if the user has a username');
});

QUnit.test('Check the structure of the papers', async assert => {
  const papers = await getPapers(LOCAL_API, TEST_USER);
  assert.ok(Array.isArray(papers), 'Check that the response is an array');
  papers.forEach(paper => testSinglePaper(assert, paper))
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
