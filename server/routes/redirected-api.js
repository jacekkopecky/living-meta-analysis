/*
 * For some testing, we don't need to run the API locally,
 * so we don't need to have access to the datastore.
 *
 * This file is a redirecting version of the API: it redirects all calls
 * to the site in process.env.REDIRECT_API (in the format
 * https://lima.soc.port.ac.uk - no trailing slash).
 *
 * It also fakes several local functions.
 */

'use strict';

const express = require('express');

const URL = process.env.REDIRECT_API;

const api = express.Router({ caseSensitive: true });
api.use((req, res) => {
  res.redirect(307, URL + req.originalUrl);
});

// in testing we expect every user to exist
function EXISTS_USER(req, res, next) {
  next();
}

// in testing we expect every request to /user/thing either to have ?type or be a metaanalysis
function getKindForTitle() {
  return 'metaanalysis';
}

// mirror the exports of index.js
module.exports = {
  router: api,
  metaanalyses: {},
  papers: {},
  users: { EXISTS_USER },
  getKindForTitle,
};
