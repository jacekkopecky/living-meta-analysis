'use strict';

const express = require('express');
const jsonBodyParser = require('body-parser').json();
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
const UnauthorizedError = require('./errors/UnauthorizedError');
const InternalError = require('./errors/InternalError');
const ValidationError = require('./errors/ValidationError');
const config = require('./config');
const storage = require('./storage');
const tools = require('./tools');

const api = module.exports = express.Router({
  caseSensitive: true,
});


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

api.get('/', (req, res) => res.redirect('/docs/api'));

api.post('/register', GUARD, REGISTER_USER, (req, res) => res.sendStatus(200));

api.get('/topusers', listTopUsers);
api.get('/toppapers', listTopPapers);
api.get('/topmetaanalyses', listTopMetaanalyses);
api.get('/titles', listTitles);

// todo drop this when client-side is migrated
api.get('/papers/titles', listTitles);

api.get(`/profile/:email(${config.EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);

api.get('/papers', listPapers);

api.get(`/papers/:email(${config.EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listPapersForUser);
api.get(`/papers/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`,
        REGISTER_USER, getPaperVersion);
api.get(`/papers/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/:time([0-9]+)/`,
        REGISTER_USER, getPaperVersion);
api.post(`/papers/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`,
        GUARD, SAME_USER, jsonBodyParser, savePaper);
// todo above, a user that isn't SAME_USER should be able to submit new comments

api.get('/columns', listColumns);
api.post('/columns', GUARD, REGISTER_USER, jsonBodyParser, saveColumn);

api.get(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listMetaanalysesForUser);
api.get(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`,
        REGISTER_USER, getMetaanalysisVersion);
api.get(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/:time([0-9]+)/`,
        REGISTER_USER, getMetaanalysisVersion);
api.get(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/papers/`,
        REGISTER_USER, getMetaanalysisPapers);
api.get(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/:time([0-9]+)/papers/`,
        REGISTER_USER, getMetaanalysisPapers);
api.post(`/metaanalyses/:email(${config.EMAIL_ADDRESS_RE})/:title(${config.TITLE_RE})/`,
        GUARD, SAME_USER, jsonBodyParser, saveMetaanalysis);


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

function apiPaperURL(email, title) { return `/api/papers/${email}/${title}`; }
function apiMetaanalysisURL(email, title) { return `/api/metanalyses/${email}/${title}`; }

module.exports.getKindForTitle = function getKindForTitle(email, title) {
  return new Promise((resolve, reject) => {
    storage.getMetaanalysisByTitle(email, title)
    .then(() => resolve('metaanalysis'))
    .catch(() => storage.getPaperByTitle(email, title))
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
function REGISTER_USER(req, res, next) {
  if (req.user) {
    const email = req.user.emails[0].value;
    storage.getUser(email)
    .catch(() => { // register the user when not found
      const user = req.user;
      // creation time - when the user was first registered
      user.ctime = tools.uniqueNow();
      console.log('registering user ' + email);
      return storage.addUser(email, user);
    })
    .then((user) => { // update access time
      user.atime = Date.now();
      next();
    })
    .catch((err) => {
      console.error('failed to register user');
      console.error(err);
      next(err);
    });
  } else {
    next();
  }
}

function SAME_USER(req, res, next) {
  try {
    if (req.user.emails[0].value === req.params.email) {
      next();
      return;
    }
  } catch (e) { /* nothing */ }
  // any error means it isn't the right user
  throw new UnauthorizedError();
}

function returnUserProfile(req, res, next) {
  storage.getUser(req.params.email)
  .then((user) => {
    const retval = {
      displayName: user.displayName,
      name: user.name,
      email: user.emails[0].value,
      photos: user.photos,
      joined: user.ctime,
    };
    res.json(retval);
  })
  .catch((err) => {
    next(err || new NotFoundError());
  });
}

function listTopUsers(req, res, next) {
  storage.listUsers()
  .then((users) => {
    const retval = [];
    for (const key of Object.keys(users)) {
      const user = users[key];
      retval.push({
        displayName: user.displayName,
        name: user.name,
        email: user.emails[0].value,
      });
    }
    res.json(retval);
  })
  .catch(() => next(new InternalError()));
}


module.exports.checkUserExists = function (req, res, next) {
  storage.getUser(req.params.email)
  .then(
    () => next(),
    () => next(new NotFoundError())
  );
};


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
function listPapers(req, res, next) {
  storage.listPapers()
  .then((papers) => {
    const retval = [];
    papers.forEach((p) => {
      retval.push(extractPaperForSending(p, false, null));
    });
    res.json(retval);
  })
  .catch((err) => next(err));
}

function listPapersForUser(req, res, next) {
  storage.getPapersEnteredBy(req.params.email)
  .then((papers) => {
    if (papers.length === 0) throw new Error('no papers found');

    const retval = [];
    papers.forEach((p) => {
      retval.push(extractPaperForSending(p, false, req.params.email));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getPaperVersion(req, res, next) {
  storage.getPaperByTitle(req.params.email, req.params.title, req.params.time)
  .then((p) => {
    res.json(extractPaperForSending(p, true, req.params.email));
  })
  .catch((e) => {
    next(e || new NotFoundError());
  });
}

function savePaper(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.savePaper(
    extractReceivedPaper(req.body),
    req.user.emails[0].value,
    req.params.title)
  .then((p) => {
    res.json(extractPaperForSending(p, true, req.params.email));
  })
  .catch((e) => {
    if (e instanceof ValidationError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractPaperArrayForSending(storagePaperArray, email) {
  return storagePaperArray.map((paper) => extractPaperForSending(paper, true, email));
}

function extractPaperForSending(storagePaper, includeDataValues, email) {
  const retval = {
    id: storagePaper.id,
    title: storagePaper.title,
    enteredBy: storagePaper.enteredBy,
    ctime: storagePaper.ctime,
    mtime: storagePaper.mtime,
    reference: storagePaper.reference,
    description: storagePaper.description,
    link: storagePaper.link,
    doi: storagePaper.doi,
    tags: storagePaper.tags,
    // todo comments in various places?
  };

  if (email) retval.apiurl = apiPaperURL(email, retval.title);

  if (includeDataValues) {
    retval.experiments = storagePaper.experiments;
    retval.columnOrder = storagePaper.columnOrder;
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
    columnOrder:    tools.array(receivedPaper.columnOrder, tools.string),
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

function listTopPapers(req, res, next) {
  storage.listPapers()
  .then((papers) => {
    const retval = [];
    for (const p of papers) {
      retval.push({
        title: p.title,
        enteredBy: p.enteredBy,
      });
    }
    res.json(retval);
  })
  .catch(() => next(new InternalError()));
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
  storage.getMetaanalysesEnteredBy(req.params.email)
  .then((mas) => {
    if (mas.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    mas.forEach((m) => {
      retval.push(extractMetaanalysisForSending(m, req.params.email));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getMetaanalysisVersion(req, res, next) {
  storage.getMetaanalysisByTitle(req.params.email, req.params.title, req.params.time)
  .then((ma) => {
    res.json(extractMetaanalysisForSending(ma, req.params.email));
  })
  .catch((e) => {
    next(e || new NotFoundError());
  });
}

function getMetaanalysisPapers(req, res, next) {
  storage.getMetaanalysisPapersByTitle(req.params.email, req.params.title, req.params.time)
  .then((papers) => {
    res.json(extractPaperArrayForSending(papers, req.params.email));
  })
  .catch((e) => {
    next(e || new NotFoundError());
  });
}

function saveMetaanalysis(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.saveMetaanalysis(
    extractReceivedMetaanalysis(req.body),
    req.user.emails[0].value,
    req.params.title)
  .then((ma) => {
    res.json(extractMetaanalysisForSending(ma, req.params.email));
  })
  .catch((e) => {
    if (e instanceof ValidationError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractMetaanalysisForSending(storageMetaanalysis, email) {
  const retval = {
    id: storageMetaanalysis.id,
    title: storageMetaanalysis.title,
    enteredBy: storageMetaanalysis.enteredBy,
    ctime: storageMetaanalysis.ctime,
    mtime: storageMetaanalysis.mtime,
    published: storageMetaanalysis.published,
    description: storageMetaanalysis.description,
    tags: storageMetaanalysis.tags,
    columnOrder: storageMetaanalysis.columnOrder,
    paperOrder: storageMetaanalysis.paperOrder,
    hiddenCols: storageMetaanalysis.hiddenCols,
    hiddenExperiments: storageMetaanalysis.hiddenExperiments,
    // todo comments in various places?
  };

  if (email) retval.apiurl = apiMetaanalysisURL(email, retval.title);

  return retval;
}

function extractReceivedMetaanalysis(receivedMetaanalysis) {
  // expecting receivedMetaanalysis to come from JSON.parse()
  const retval = {
    id:                tools.string(receivedMetaanalysis.id),        // identifies the MA to be changed
    title:             tools.string(receivedMetaanalysis.title),
    CHECKenteredBy:    tools.string(receivedMetaanalysis.enteredBy), // can't be changed but should be checked
    CHECKctime:        tools.number(receivedMetaanalysis.ctime),     // can't be changed but should be checked
    // mtime: tools.number(receivedMetaanalysis.mtime),              // will be updated
    published:         tools.string(receivedMetaanalysis.published),
    description:       tools.string(receivedMetaanalysis.description),
    tags:              tools.array(receivedMetaanalysis.tags, tools.string),
    columnOrder:       tools.array(receivedMetaanalysis.columnOrder, tools.string),
    paperOrder:        tools.array(receivedMetaanalysis.paperOrder, tools.string),
    hiddenCols:        tools.array(receivedMetaanalysis.hiddenCols, tools.string),
    hiddenExperiments: tools.array(receivedMetaanalysis.hiddenExperiments, tools.string),
  };

  return retval;
}

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


/* columns
 *
 *
 *         ####   ####  #      #    # #    # #    #  ####
 *        #    # #    # #      #    # ##  ## ##   # #
 *        #      #    # #      #    # # ## # # #  #  ####
 *        #      #    # #      #    # #    # #  # #      #
 *        #    # #    # #      #    # #    # #   ## #    #
 *         ####   ####  ######  ####  #    # #    #  ####
 *
 *
 */
function listColumns(req, res, next) {
  storage.listColumns()
  .then((columns) => {
    const retval = {};
    for (const key of Object.keys(columns)) {
      retval[key] = extractColumnForSending(columns[key]);
    }
    res.json(retval);
  })
  .catch((err) => next(err));
}

function extractColumnForSending(storageColumn) {
  return {
    id: storageColumn.id,
    title: storageColumn.title,
    type: storageColumn.type,
    description: storageColumn.description,
    formula: storageColumn.formula,
    formulaColumns: storageColumn.formulaColumns,
    definedBy: storageColumn.definedBy,
    ctime: storageColumn.ctime,
    mtime: storageColumn.mtime,
    // unit: 'person', // optional
    // todo comments
  };
}

function saveColumn(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.saveColumn(extractReceivedColumn(req.body), req.user.emails[0].value)
  .then((column) => {
    res.json(extractColumnForSending(column));
  })
  .catch((e) => {
    if (e instanceof ValidationError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractReceivedColumn(recCol) {
  // expecting receivedColumn to come from JSON.parse()
  return {
    id: tools.string(recCol.id),
    title: tools.string(recCol.title),
    type: tools.string(recCol.type),
    description: tools.string(recCol.description),
    formula: tools.string(recCol.formula),
    formulaColumns: tools.array(recCol.formulaColumns, tools.string),
    CHECKdefinedBy: tools.string(recCol.definedBy), // can't be changed but should be checked
    CHECKctime: tools.number(recCol.ctime),         // can't be changed but should be checked
    // mtime: tools.number(recCol.mtime),           // will be updated
  };
}

module.exports.ready = storage.ready;
