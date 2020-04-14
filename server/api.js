'use strict';

const express = require('express');

// guard middleware enforcing that a user is logged in
const GOOGLE_USER = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
const UnauthorizedError = require('./errors/UnauthorizedError');
const InternalError = require('./errors/InternalError');
const ValidationError = require('./errors/ValidationError');
const NotImplementedError = require('./errors/NotImplementedError');
const config = require('./config');
const storage = require('./storage');
const tools = require('./lib/tools');

const jsonBodyParser = express.json(config.jsonParserOptions);

const api = module.exports = express.Router({
  caseSensitive: true,
});

module.exports.init = () => {
  setUpRoutes();
  return module.exports;
};

/* routes
 *
 *
 *        #####   ####  #    # ##### ######  ####
 *        #    # #    # #    #   #   #      #
 *        #    # #    # #    #   #   #####   ####
 *        #####  #    # #    #   #   #           #
 *        #   #  #    # #    #   #   #      #    #
 *        #    #  ####   ####    #   ######  ####
 *
 *
 */

function setUpRoutes() {
  api.get('/', (req, res) => res.redirect('/docs/api'));

  api.get('/user', GOOGLE_USER, checkUser);
  api.post('/user', GOOGLE_USER, jsonBodyParser, saveUser);

  // todo top users/papers/metaanalyses would currently return all of them, which is a privacy issue
  // we may need editorial control, tags like 'public' or absence of tags like 'private'
  // api.get('/topusers', listTopUsers);
  // api.get('/toppapers', listTopPapers);
  api.get('/topmetaanalyses', listTopMetaanalyses);
  api.get('/titles', listTitles);

  api.get(`/profile/:user(${config.USER_RE})`, returnUserProfile);

  api.get(`/papers/:user(${config.USER_RE})/`,
      listPapersForUser);
  api.get(`/papers/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
      getPaperVersion);
  api.get(`/papers/:user(${config.USER_RE})\/:title(${config.URL_TITLE_RE})/:time([0-9]+)/`,
      getPaperVersion);
  api.post(`/papers/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
          GOOGLE_USER, SAME_USER, jsonBodyParser, savePaper);

  // todo above, a user that isn't SAME_USER should be able to submit new comments

  api.get(`/metaanalyses/:user(${config.USER_RE})`,
          listMetaanalysesForUser);
  api.get(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
          getMetaanalysisVersion);
  api.get(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/:time([0-9]+)/`,
          getMetaanalysisVersion);
  api.post(`/metaanalyses/:user(${config.USER_RE})/:title(${config.URL_TITLE_RE})/`,
          GOOGLE_USER, SAME_USER, jsonBodyParser, saveMetaanalysis);
}


/* shared
 *
 *
 *    ####  #    #   ##   #####  ###### #####
 *   #      #    #  #  #  #    # #      #    #
 *    ####  ###### #    # #    # #####  #    #
 *        # #    # ###### #####  #      #    #
 *   #    # #    # #    # #   #  #      #    #
 *    ####  #    # #    # #    # ###### #####
 *
 *
 */

function apiPaperURL(user, title) {
  return `/api/papers/${user}/${title || config.NEW_PAPER_TITLE}`;
}
function apiMetaanalysisURL(user, title) {
  return `/api/metaanalyses/${user}/${title || config.NEW_META_TITLE}`;
}

module.exports.getKindForTitle = function getKindForTitle(user, title) {
  return new Promise((resolve, reject) => {
    storage.getMetaanalysisByTitle(user, title)
    .then(() => resolve('metaanalysis'))
    .catch(() => storage.getPaperByTitle(user, title))
    .then(() => resolve('paper'))
    .catch((err) => reject(err));
  });
};

function listTitles(req, res, next) {
  storage.listTitles()
  .then((titles) => {
    const retval = [];
    titles.forEach((t) => {
      if (typeof t === 'string') retval.push(t);
    });
    res.json(retval);
  })
  .catch((err) => next(err));
}

/* users
 *
 *
 *         #    #  ####  ###### #####   ####
 *         #    # #      #      #    # #
 *         #    #  ####  #####  #    #  ####
 *         #    #      # #      #####       #
 *         #    # #    # #      #   #  #    #
 *          ####   ####  ###### #    #  ####
 *
 *
 */

// check that the user in the URL is the same as the one logged in, and that they are registered
function SAME_USER(req, res, next) {
  const email = req.user.emails[0].value;
  storage.getUser(email) // check the user is registered
  .then((user) => {
    if (user.email === req.params.user ||
        user.username === req.params.user) {
      next();
    } else {
      throw new Error(); // will be turned to UnauthorizedError below
    }
  })
  .catch(() => {
    // User is not known, return 401 to be caught by caller
    next(new UnauthorizedError('Please register with LiMA at /register'));
  });
}

module.exports.EXISTS_USER = function (req, res, next) {
  storage.getUser(req.params.user)
  .then(
    () => next(),
    () => next(new NotFoundError())
  );
};

function saveUser(req, res, next) {
  const user = extractReceivedUser(req.user);
  user.mtime = Date.now(); // update modification time - this is the last time the user agreed to T&C&PP
  user.username = tools.string(req.body.username);
  storage.saveUser(user.email, user)
  .then((storageUser) => {
    res.json(extractUserForSending(storageUser));
  })
  .catch((err) => {
    next(err instanceof Error ? err : new InternalError(err));
  });
}

// Check that the user is known to LiMA and that LiMA has up-to-date values from the identity provider.
function checkUser(req, res, next) {
  const email = req.user.emails[0].value;
  storage.getUser(email)
  .then((storageUser) => {
    // Check whether there are any changes to the Google Object
    const strippedGoogleUser = extractReceivedUser(req.user);
    if (strippedGoogleUser.displayName !== storageUser.displayName ||
        strippedGoogleUser.email !== storageUser.email ||
        JSON.stringify(strippedGoogleUser.photos) !== JSON.stringify(storageUser.photos)) {
      Object.assign(storageUser, strippedGoogleUser);
      storage.saveUser(storageUser.email, storageUser)
      .then((savedUser) => {
        res.json(extractUserForSending(savedUser));
      })
      .catch((err) => {
        next(new InternalError(err));
      });
    } else {
      res.json(extractUserForSending(storageUser));
    }
  })
  .catch(() => {
    // User is not known to LiMA, return 401 to be caught by caller
    next(new UnauthorizedError('Please register with LiMA at /register'));
  });
}

function extractReceivedUser(receivedUser) {
  // expecting receivedUser to be a Javascript object
  const retval = {
    displayName:      tools.string(receivedUser.displayName),
    email:            tools.string(receivedUser.emails[0].value),
    photos:           tools.array(receivedUser.photos, extractReceivedPhoto),
  };

  return retval;
}

function extractReceivedPhoto(recPhoto) {
  const retval = {
    value: tools.string(recPhoto.value),
  };
  return retval;
}

function returnUserProfile(req, res, next) {
  storage.getUser(req.params.user)
  .then((user) => {
    res.json(extractUserForSending(user));
  })
  .catch((err) => {
    if (err && err.status) {
      next(err);
    } else {
      next(new NotFoundError());
    }
  });
}

function extractUserForSending(user) {
  const retval = {
    displayName: user.displayName,
    name: user.name,
    email: user.email,
    photos: user.photos,
    joined: user.ctime,
    username: user.username,
  };
  return retval;
}


/* papers
 *
 *
 *        #####    ##   #####  ###### #####   ####
 *        #    #  #  #  #    # #      #    # #
 *        #    # #    # #    # #####  #    #  ####
 *        #####  ###### #####  #      #####       #
 *        #      #    # #      #      #   #  #    #
 *        #      #    # #      ###### #    #  ####
 *
 *
 */
function listPapersForUser(req, res, next) {
  storage.getPapersEnteredBy(req.params.user)
  .then((papers) => {
    if (papers.length === 0) throw new Error('no papers found');

    const retval = [];
    papers.forEach((p) => {
      retval.push(extractPaperForSending(p, false, req.params.user));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getPaperVersion(req, res, next) {
  storage.getPaperByTitle(req.params.user, req.params.title, req.params.time)
  .then((p) => {
    return storage.getUsernameOfUser(p.enteredBy)
    .then((username) => {
      res.json(extractPaperForSending(p, true, req.params.user, username));
    });
  })
  .catch((e) => {
    next(e.status ? e : new NotFoundError());
  });
}

function savePaper(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.savePaper(
    extractReceivedPaper(req.body),
    req.user.emails[0].value,
    req.params.title)
  .then((p) => {
    res.json(extractPaperForSending(p, true, req.params.user));
  })
  .catch((e) => {
    if (e instanceof ValidationError || e instanceof NotImplementedError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractPaperForSending(storagePaper, includeDataValues, user, username) {
  const retval = {
    id: storagePaper.id,
    title: storagePaper.title,
    enteredBy: storagePaper.enteredBy,
    enteredByUsername: username,
    ctime: storagePaper.ctime,
    mtime: storagePaper.mtime,
    reference: storagePaper.reference,
    description: storagePaper.description,
    link: storagePaper.link,
    doi: storagePaper.doi,
    tags: storagePaper.tags,
    // todo comments in various places?
  };

  if (user) retval.apiurl = apiPaperURL(user, retval.title);

  if (includeDataValues) {
    retval.experiments = storagePaper.experiments;
    retval.columns = storagePaper.columns;
    retval.hiddenCols = storagePaper.hiddenCols;
  }

  return retval;
}

function extractReceivedPaper(receivedPaper) {
  // expecting receivedPaper to come from JSON.parse()
  const retval = {
    id:             tools.string(receivedPaper.id),        // identifies the paper to be changed
    title:          tools.string(receivedPaper.title),
    CHECKenteredBy: tools.string(receivedPaper.enteredBy), // can't be changed but should be checked
    CHECKctime:     tools.number(receivedPaper.ctime),     // can't be changed but should be checked
    // mtime: tools.number(receivedPaper.mtime),           // will be updated
    reference:      tools.string(receivedPaper.reference),
    description:    tools.string(receivedPaper.description),
    link:           tools.string(receivedPaper.link),
    doi:            tools.string(receivedPaper.doi),
    tags:           tools.array(receivedPaper.tags, tools.string),
    experiments:    tools.array(receivedPaper.experiments, extractReceivedExperiment),
    columns:        tools.array(receivedPaper.columns, extractReceivedColumnEntry),
    hiddenCols:     tools.array(receivedPaper.hiddenCols, tools.string),
  };

  // todo anything else recently added to the data

  return retval;
}

function extractReceivedExperiment(receivedExperiment) {
  const retval = {
    title: tools.string(receivedExperiment.title),
    CHECKenteredBy: tools.string(receivedExperiment.enteredBy),
    CHECKctime: tools.number(receivedExperiment.ctime),
    description: tools.string(receivedExperiment.description),
    data: tools.assoc(receivedExperiment.data, extractReceivedExperimentDatum),
    comments: tools.array(receivedExperiment.comments, extractReceivedComment),
  };
  return retval;
}

function extractReceivedExperimentDatum(receivedDatum) {
  const retval = {
    value: tools.string(receivedDatum.value),
    CHECKenteredBy: tools.string(receivedDatum.enteredBy),
    CHECKctime: tools.number(receivedDatum.ctime),
    comments: tools.array(receivedDatum.comments, extractReceivedComment),
  };
  return retval;
}

function extractReceivedComment(receivedComment) {
  const retval = {
    CHECKby: tools.string(receivedComment.by),
    CHECKctime: tools.number(receivedComment.ctime),
    onVersionBy: tools.string(receivedComment.onVersionBy),
    text: tools.string(receivedComment.text),
    hidden: tools.bool(receivedComment.hidden),
  };
  return retval;
}


/* metaanalyses
 *
 *
 *    #    # ###### #####   ##     ##   #    #   ##   #      #   #  ####  ######  ####
 *    ##  ## #        #    #  #   #  #  ##   #  #  #  #       # #  #      #      #
 *    # ## # #####    #   #    # #    # # #  # #    # #        #    ####  #####   ####
 *    #    # #        #   ###### ###### #  # # ###### #        #        # #           #
 *    #    # #        #   #    # #    # #   ## #    # #        #   #    # #      #    #
 *    #    # ######   #   #    # #    # #    # #    # ######   #    ####  ######  ####
 *
 *
 */
function listMetaanalysesForUser(req, res, next) {
  storage.getMetaanalysesEnteredBy(req.params.user)
  .then((mas) => {
    if (mas.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    mas.forEach((m) => {
      retval.push(extractMetaanalysisForSending(m, false, req.params.user));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getMetaanalysisVersion(req, res, next) {
  storage.getMetaanalysisByTitle(req.params.user, req.params.title, req.params.time, true)
  .then((ma) => {
    return storage.getUsernameOfUser(ma.enteredBy)
    .then((username) => {
      res.json(extractMetaanalysisForSending(ma, true, req.params.user, username));
    });
  })
  .catch((e) => {
    next(e && e.status ? e : new NotFoundError());
  });
}

function saveMetaanalysis(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.saveMetaanalysis(
    extractReceivedMetaanalysis(req.body),
    req.user.emails[0].value,
    req.params.title)
  .then((ma) => {
    res.json(extractMetaanalysisForSending(ma, false, req.params.user));
  })
  .catch((e) => {
    if (e instanceof ValidationError || e instanceof NotImplementedError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractMetaanalysisForSending(storageMetaanalysis, includePapers, user, username) {
  const retval = {
    id: storageMetaanalysis.id,
    title: storageMetaanalysis.title,
    enteredBy: storageMetaanalysis.enteredBy,
    enteredByUsername: username,
    ctime: storageMetaanalysis.ctime,
    mtime: storageMetaanalysis.mtime,
    published: storageMetaanalysis.published,
    description: storageMetaanalysis.description,
    tags: storageMetaanalysis.tags,
    columns: storageMetaanalysis.columns,
    paperOrder: storageMetaanalysis.paperOrder,
    hiddenCols: storageMetaanalysis.hiddenCols,
    hiddenExperiments: storageMetaanalysis.hiddenExperiments,
    excludedExperiments: storageMetaanalysis.excludedExperiments,
    aggregates: storageMetaanalysis.aggregates,
    groupingColumn: storageMetaanalysis.groupingColumn,
    groupingAggregates: storageMetaanalysis.groupingAggregates,
    graphs: storageMetaanalysis.graphs,
    // todo comments in various places?
  };

  if (user) retval.apiurl = apiMetaanalysisURL(user, retval.title);

  if (includePapers && storageMetaanalysis.papers) {
    retval.papers = [];
    storageMetaanalysis.papers.forEach((p) => retval.papers.push(extractPaperForSending(p, true, user)));
  }

  return retval;
}

function extractReceivedMetaanalysis(receivedMetaanalysis) {
  // expecting receivedMetaanalysis to come from JSON.parse()
  const retval = {
    id:                  tools.string(receivedMetaanalysis.id),        // identifies the MA to be changed
    title:               tools.string(receivedMetaanalysis.title),
    CHECKenteredBy:      tools.string(receivedMetaanalysis.enteredBy), // can't be changed but should be checked
    CHECKctime:          tools.number(receivedMetaanalysis.ctime),     // can't be changed but should be checked
    // mtime: tools.number(receivedMetaanalysis.mtime),              // will be updated
    published:           tools.string(receivedMetaanalysis.published),
    description:         tools.string(receivedMetaanalysis.description),
    tags:                tools.array(receivedMetaanalysis.tags, tools.string),
    columns:             tools.array(receivedMetaanalysis.columns, extractReceivedMetaanalysisColumnEntry),
    paperOrder:          tools.array(receivedMetaanalysis.paperOrder, tools.string),
    hiddenCols:          tools.array(receivedMetaanalysis.hiddenCols, tools.string),
    hiddenExperiments:   tools.array(receivedMetaanalysis.hiddenExperiments, tools.string),
    excludedExperiments: tools.array(receivedMetaanalysis.excludedExperiments, tools.string),
    aggregates:          tools.array(receivedMetaanalysis.aggregates, extractReceivedAggregate),
    groupingColumn:      tools.string(receivedMetaanalysis.groupingColumn),
    groupingAggregates:  tools.array(receivedMetaanalysis.groupingAggregates, extractReceivedAggregate),
    graphs:              tools.array(receivedMetaanalysis.graphs, extractReceivedGraph),
  };

  return retval;
}

function extractReceivedColumnEntry(recCol) {
  if (typeof recCol === 'object') {
    return {
      id: tools.string(recCol.id),
      title: tools.string(recCol.title),
      description: tools.string(recCol.description),
      type: tools.string(recCol.type),
      formula: tools.string(recCol.formula),
      comments: tools.array(recCol.comments, extractReceivedComment),
      obsoleteIDForMigration: tools.string(recCol.obsoleteIDForMigration),
    };
  }

  return undefined;
}

function extractReceivedMetaanalysisColumnEntry(recCol) {
  const col = extractReceivedColumnEntry(recCol);
  if (col) {
    col.sourceColumnMap = tools.assoc(recCol.sourceColumnMap, tools.string);
    delete col.obsoleteIDForMigration;
  }

  return col;
}

function extractReceivedAggregate(recAggr) {
  // expecting receivedAggregate to come from JSON.parse()
  return {
    formula: tools.string(recAggr.formula),
    comments: tools.array(recAggr.comments, extractReceivedComment),
    title: tools.string(recAggr.title),
  };
}

function extractReceivedGraph(recGraph) {
  // uses a formula string just like computed columns and aggregates
  return {
    formula: tools.string(recGraph.formula),
    comments: tools.array(recGraph.comments, extractReceivedComment),
    title: tools.string(recGraph.title),
  };
}

// todo filter by tag 'showcase' here rather than in index.html
function listTopMetaanalyses(req, res, next) {
  storage.listMetaanalyses()
  .then((mas) => {
    const retval = [];
    for (const ma of mas) {
      retval.push({
        title: ma.title,
        enteredBy: ma.enteredBy,
      });
    }
    res.json(retval);
  })
  .catch(() => next(new InternalError()));
}
