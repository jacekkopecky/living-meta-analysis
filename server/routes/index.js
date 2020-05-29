'use strict';

const express = require('express');
const config = require('../config');

// guard middleware enforcing that a user is logged in
const GOOGLE_USER = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const api = express.Router({ caseSensitive: true });
const jsonBodyParser = express.json(config.jsonParserOptions);

const metaanalyses = require('./metaanalyses');
const papers = require('./papers');
const users = require('./users');

const storage = require('../storage');

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

// todo top users/papers/metaanalyses would currently return all of them, which is a privacy issue
// we may need editorial control, tags like 'public' or absence of tags like 'private'
// api.get('/topusers', listTopUsers);
// api.get('/toppapers', listTopPapers);

api.get('/', (req, res) => res.redirect('/docs/api'));

/* ---------------------------------- Users --------------------------------- */

api.get('/user', GOOGLE_USER, users.checkUser);
api.post('/user', GOOGLE_USER, jsonBodyParser, users.saveUser);

api.get(`/profile/:user(${config.USER_RE})`, users.returnUserProfile);

/* --------------------------------- Papers --------------------------------- */

// todo include /titles to return all titles
api.get('/titles', listTitles);
api.get(`/papers/:user(${config.USER_RE})/`, papers.listPapersForUser);

api.get(`/papers/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, papers.getPaperVersion);
api.get(`/papers/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/:time([0-9]+)/`, papers.getPaperVersion);
api.post(`/papers/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, GOOGLE_USER, users.SAME_USER, jsonBodyParser, papers.savePaper);
// todo above, a user that isn't SAME_USER should be able to submit new comments

/* ------------------------------ Metaanalyses ------------------------------ */

api.get('/topmetaanalyses', metaanalyses.listTopMetaanalyses);
api.get(`/metaanalyses/:user(${config.USER_RE})`, metaanalyses.listMetaanalysesForUser);
api.get(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, metaanalyses.getMetaanalysisVersion);
api.get(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/:time([0-9]+)/`, metaanalyses.getMetaanalysisVersion);
api.post(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`, GOOGLE_USER, users.SAME_USER, jsonBodyParser, metaanalyses.saveMetaanalysis);

/* -------------------------------------------------------------------------- */
/*                                   Shared                                   */
/* -------------------------------------------------------------------------- */

// TODO: Test/Review function
async function getKindForTitle(user, title) {
  const metaanalyses = await storage.metaanalyses.getMetaanalysisByTitle(
    user,
    title,
  );

  if (metaanalyses) return 'metaanalysis';
  const paper = await storage.papers.getPaperByTitle(user, title);
  if (paper) return 'paper';
  throw new Error('Nothing found');
}

const sharedStorage = require('../storage/shared');

// TODO: needed route? unsure of function of this
function listTitles(req, res, next) {
  // try {
  //   const titles = sharedStorage.allTitles;
  //   const retval = [];
  //   titles.forEach((t) => {
  //     if (typeof t === 'string') retval.push(t);
  //   });
  //   res.json(retval);
  // } catch (error) {
  //   next(error);
  // }
  console.log('Do we need this?');
  res.send([]);
}

// module.exports = api;
module.exports = {
  router: api,
  metaanalyses,
  papers,
  users,
  getKindForTitle,
};
