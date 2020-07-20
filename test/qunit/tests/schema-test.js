/* global QUnit */
'use strict';

const requireDir = require('require-directory');
const path = require('path');
// const fetch = require('node-fetch');
const helpers = require('../helpers');
const config = require('../config');
const Ajv = require('ajv');

/* --------------------------------- Schemas -------------------------------- */

const schemas = requireDir(module, path.join(__dirname, '..', '..', 'schemas'));

const ajv = new Ajv({ schemas: Object.values(schemas), allErrors: true, jsonPointers: true });
require('ajv-errors')(ajv);
require('ajv-merge-patch')(ajv);

/* -------------------------------------------------------------------------- */
/*                       Test to check structure of data                      */
/* -------------------------------------------------------------------------- */
QUnit.module('Structure Test');

QUnit.test('Check the structure of the user', async assert => {
  const user = await helpers.getProfile(config.LOCAL_API, config.TEST_USER);
  const validate = ajv.getSchema(`${config.SCHEMA_URI}/profile`);
  const valid = validate(user);
  assert.ok(valid, 'Check the structure of the user matches the schema');
});

QUnit.test('Check the structure of the papers', async assert => {
  const papers = await helpers.getPapers(config.LOCAL_API, config.TEST_USER);
  const validate = ajv.getSchema(`${config.SCHEMA_URI}/user-papers`);
  const valid = validate(papers);
  assert.ok(valid, 'Check the structure of the papers matches the schema');
});

QUnit.test('Check the structure of a specific paper', async assert => {
  const paper = await helpers.getPaperByTitle(config.LOCAL_API, config.TEST_USER, config.TEST_PAPER);
  const validate = ajv.getSchema(`${config.SCHEMA_URI}/paper-title`);
  const valid = validate(paper);
  assert.ok(valid, 'Check the structure of the paper matches the schema');
});

QUnit.test('Check the strucutre of the metaanalysis', async assert => {
  const metaanalyses = await helpers.getMetaanalyses(config.LOCAL_API, config.TEST_USER);
  const validate = ajv.getSchema(`${config.SCHEMA_URI}/metaanalyses`);
  const valid = validate(metaanalyses);
  assert.ok(valid, 'Check the structure of the metaanalyses matches the schema');
});

QUnit.test('Check the strucutre of the metaanalysis for specific title', async assert => {
  const metaanalysis = await helpers.getMetaanlysisByTitle(config.LOCAL_API, config.TEST_USER, config.TEST_METAANALYSES);
  const validate = ajv.getSchema(`${config.SCHEMA_URI}/metaanalysis-title`);
  const valid = validate(metaanalysis);
  assert.ok(valid, 'Check the structure of the metaanalysis matches the schema');
});

// todo: implement this test when the ability to have unique names per user, and the ability to remove a metanalysis
// QUnit.test('Creating a new blank metanalysis', async assert => {
//   const request = await fetch(`${config.LOCAL_API}/metaanalyses/test-account/test-metanalysis`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': 'Fake test',
//     },
//     body: JSON.stringify({
//       title: 'test-metaanalysis',
//       enteredBy: 'test@fake.example.org',
//     }),
//   });

//   const response = await request.text();

//   try {
//     const obj = JSON.parse(response);
//     const validate = ajv.getSchema(`${config.SCHEMA_URI}/metaanalysis-base`);
//     const valid = validate(obj);
//     assert.ok(valid, 'Check the structure of the saved metaanalysis matches the schema');
//   } catch (error) {
//     assert.ok(false, response);
//   }
// });
