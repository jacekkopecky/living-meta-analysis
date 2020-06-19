/* global QUnit */
'use strict';

const helpers = require('../helpers');
const config = require('../config');

/* -------------------------------------------------------------------------- */
/*                                  Snapshots                                 */
/* -------------------------------------------------------------------------- */

const profileTestData = require('../snapshots/profile.json');
const paperTestData = require('../snapshots/user_papers.json');
const paperTitleTestData = require('../snapshots/paper-title.json');
const metaanalysesTestData = require('../snapshots/metaanalyses.json');
const metaanalysesTitleTestData = require('../snapshots/metaanalyses-title.json');

/* -------------------------------------------------------------------------- */
/*                     Tests to check against old version                     */
/* -------------------------------------------------------------------------- */

QUnit.module('API Comparison');

QUnit.test('Get user profile', async assert => {
  const req1 = await helpers.getProfile(config.LOCAL_API, config.TEST_USER);
  assert.deepEqual(req1, profileTestData, 'The body should be the same');
});

QUnit.test('Get papers from a specific user', async assert => {
  const req1 = await helpers.getPapers(config.LOCAL_API, config.TEST_USER);
  assert.deepEqual(req1, paperTestData, 'The body should be the same');
});

QUnit.test('Get a paper by title', async assert => {
  const req1 = await helpers.getPaperByTitle(config.LOCAL_API, config.TEST_USER, config.TEST_PAPER);
  assert.deepEqual(req1, paperTitleTestData, 'The body should be the same');
});

QUnit.test('Get all metaanalysis by a user', async assert => {
  const req1 = await helpers.getMetaanalyses(config.LOCAL_API, config.TEST_USER);
  assert.deepEqual(req1, metaanalysesTestData, 'The body should be the same');
});

QUnit.test('Get a metaanalysis by title', async assert => {
  const req1 = await helpers.getMetaanlysisByTitle(config.LOCAL_API, config.TEST_USER, config.TEST_METAANALYSES);
  assert.deepEqual(req1, metaanalysesTitleTestData, 'The body should be the same');
});
