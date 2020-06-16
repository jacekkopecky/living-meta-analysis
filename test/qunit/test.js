/* global QUnit */
'use strict';

const requireDir = require('require-directory');

const fetch = require('node-fetch');
const Ajv = require('ajv');
const SCHEMA_URI = 'https://lima.soc.port.ac.uk/schemas';
const LOCAL_API = 'http://localhost:8080/api';
const TEST_USER = 'hartmut.blank@port.ac.uk';
const TEST_METAANALYSES = 'MisinformationEffect';
const TEST_PAPER = 'LiveVideo';

/* --------------------------------- Schemas -------------------------------- */

const schemas = requireDir(module, '../schemas');

const ajv = new Ajv({ schemas: Object.values(schemas), allErrors: true, jsonPointers: true });
require('ajv-errors')(ajv);
require('ajv-merge-patch')(ajv);


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
/*                     Tests to check against old version                     */
/* -------------------------------------------------------------------------- */

QUnit.module('API Comparison');

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
  const validate = ajv.getSchema(`${SCHEMA_URI}/profile`);
  const valid = validate(user);
  assert.ok(valid, 'Check the structure of the user matches the schema');
});

QUnit.test('Check the structure of the papers', async assert => {
  const papers = await getPapers(LOCAL_API, TEST_USER);
  const validate = ajv.getSchema(`${SCHEMA_URI}/user-papers`);
  const valid = validate(papers);
  assert.ok(valid, 'Check the structure of the papers matches the schema');
});

QUnit.test('Check the structure of a specific paper', async assert => {
  const paper = await getPaperByTitle(LOCAL_API, TEST_USER, TEST_PAPER);
  const validate = ajv.getSchema(`${SCHEMA_URI}/paper-title`);
  const valid = validate(paper);
  assert.ok(valid, 'Check the structure of the paper matches the schema');
});

QUnit.test('Check the strucutre of the metaanalysis', async assert => {
  const metaanalyses = await getMetaanalyses(LOCAL_API, TEST_USER);
  const validate = ajv.getSchema(`${SCHEMA_URI}/metaanalyses`);
  const valid = validate(metaanalyses);
  assert.ok(valid, 'Check the structure of the metaanalyses matches the schema');
});

QUnit.test('Check the strucutre of the metaanalysis for specific title', async assert => {
  const metaanalysis = await getMetaanlysisByTitle(LOCAL_API, TEST_USER, TEST_METAANALYSES);
  const validate = ajv.getSchema(`${SCHEMA_URI}/metaanalysis-title`);
  const valid = validate(metaanalysis);
  assert.ok(valid, 'Check the structure of the metaanalysis matches the schema');
});

QUnit.test('Creating a new blank metanalyses', async assert => {
  const request = await fetch(`${LOCAL_API}/metaanalyses/test-account/test-metanalyses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Fake test',
    },
    body: JSON.stringify({
      title: 'test-metaanalyses',
      enteredBy: 'test@fake.example.org',
    }),
  });

  const response = await request.text();

  try {
    const obj = JSON.parse(response);
    const validate = ajv.getSchema(`${SCHEMA_URI}/metaanalysis-base`);
    const valid = validate(obj);
    assert.ok(valid, 'Check the structure of the saved metaanalysis matches the schema');
  } catch (error) {
    assert.ok(false, response);
  }
});
