'use strict';

const express = require('express');
const jsonBodyParser = require('body-parser').json();
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
const UnauthorizedError = require('./errors/UnauthorizedError');
const InternalError = require('./errors/InternalError');
const ValidationError = require('./errors/ValidationError');
const storage = require('./storage');
const tools = require('./tools');

const api = module.exports = express.Router({
  caseSensitive: true,
});

const EMAIL_ADDRESS_RE = module.exports.EMAIL_ADDRESS_RE = '[a-zA-Z0-9.+-]+@[a-zA-Z0-9.+-]+';
const TITLE_RE = module.exports.TITLE_RE = storage.TITLE_RE;

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

api.get('/topusers', REGISTER_USER, listTopUsers);
api.get('/toppapers', REGISTER_USER, listTopPapers);
api.get('/topmetaanalyses', REGISTER_USER, listTopMetaanalyses);

api.get(`/profile/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);

function apiPaperURL(email, title) { return `/api/papers/${email}/${title}`; }

api.get('/papers/titles', listPaperTitles);
api.get('/papers', listPapers);

api.get(`/papers/:email(${EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listPapersForUser);
api.get(`/papers/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/`,
        REGISTER_USER, getPaperVersion);
api.get(`/papers/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/:time([0-9]+)/`,
        REGISTER_USER, getPaperVersion);
api.post(`/papers/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/`,
        GUARD, SAME_USER, jsonBodyParser, savePaper);
// todo above, a user that isn't SAME_USER should be able to submit new comments

api.get('/columns', REGISTER_USER, listColumns);
api.post('/columns', GUARD, REGISTER_USER, jsonBodyParser, saveColumn);

function apiMetaanalysisURL(email, title) { return `/api/metanalyses/${email}/${title}`; }

api.get('/metaanalyses/titles', listMetaanalysisTitles);

api.get(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listMetaanalysesForUser);

api.get(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/`,
        REGISTER_USER, getMetaanalysisVersion);
api.get(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/:time([0-9]+)/`,
        REGISTER_USER, getMetaanalysisVersion);
api.post(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})/:title(${TITLE_RE})/`,
        GUARD, SAME_USER, jsonBodyParser, saveMetaanalysis);

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
    console.error(err);
    next(new NotFoundError());
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
    const retval = {};
    for (const key of Object.keys(papers)) {
      retval[key] = extractPaperForSending(papers[key]);
    }
    res.json(retval);
  })
  .catch(() => next(new InternalError('cannot get papers, why?!?')));
}

module.exports.getKindForTitle = function getKindForTitle(email, title) {
  return new Promise((resolve, reject) => {
    storage.getMetaanalysisByTitle(email, title)
    .then(() => resolve('metaanalysis'))
    .catch(() => storage.getPaperByTitle(email, title))
    .then(() => resolve('paper'))
    .catch((err) => reject(err));
  });
};

function listPaperTitles(req, res, next) {
  storage.listPaperTitles()
  .then((titles) => {
    const retval = [];
    titles.forEach((t) => {
      if (typeof t === 'string') retval.push(t);
    });
    res.json(retval);
  })
  .catch((err) => next(err));
}

function listPapersForUser(req, res, next) {
  storage.getPapersEnteredBy(req.params.email)
  .then((papers) => {
    if (papers.length === 0) throw new Error('no metaanalyses found');

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
    console.error(e);
    next(new NotFoundError());
  });
}

function savePaper(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.savePaper(extractReceivedPaper(req.body), req.user.emails[0].value, req.params.title)
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

  retval.apiurl = apiPaperURL(email, retval.title);

  if (includeDataValues) {
    // todo this may not be how the data ends up being encoded
    retval.experiments = storagePaper.experiments;
    retval.columnOrder = storagePaper.columnOrder;
    retval.hiddenCols = storagePaper.hiddenCols;
  }

  return retval;
}

function extractReceivedPaper(receivedPaper) {
  // expecting receivedPaper to come from JSON.parse()
  const retval = {
    id: tools.string(receivedPaper.id),                  // identifies the paper to be changed
    title: tools.string(receivedPaper.title),
    CHECKenteredBy: tools.string(receivedPaper.enteredBy), // can't be changed but should be checked
    CHECKctime: tools.number(receivedPaper.ctime),         // can't be changed but should be checked
    // mtime: tools.number(receivedPaper.mtime),         // will be updated
    reference: tools.string(receivedPaper.reference),
    description: tools.string(receivedPaper.description),
    link: tools.string(receivedPaper.link),
    doi: tools.string(receivedPaper.doi),
    tags: tools.array(receivedPaper.tags, tools.string),
    experiments: tools.array(receivedPaper.experiments, extractReceivedExperiment),
    comments: tools.array(receivedPaper.comments, extractReceivedComment),
    columnOrder: tools.array(receivedPaper.columnOrder, tools.string),
    hiddenCols: tools.array(receivedPaper.hiddenCols, tools.string),
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
function listMetaanalysisTitles(req, res, next) {
  storage.listMetaanalysisTitles()
  .then((titles) => {
    const retval = [];
    titles.forEach((t) => {
      if (typeof t === 'string') retval.push(t);
    });
    res.json(retval);
  })
  .catch((err) => next(err));
}

function listMetaanalysesForUser(req, res, next) {
  storage.getMetaanalysesEnteredBy(req.params.email)
  .then((mas) => {
    if (mas.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    mas.forEach((m) => {
      retval.push(extractMetaanalysisForSending(m, false, req.params.email));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getMetaanalysisVersion(req, res, next) {
  storage.getMetaanalysisByTitle(req.params.email, req.params.title, req.params.time)
  .then((ma) => {
    res.json(extractMetaanalysisForSending(ma, true, req.params.email));
  })
  .catch((e) => {
    console.error(e);
    next(new NotFoundError());
  });
}

function saveMetaanalysis(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.saveMetaanalysis(extractReceivedMetaanalysis(req.body), req.user.emails[0].value, req.params.title)
  .then((ma) => {
    res.json(extractMetaanalysisForSending(ma, true, req.params.email));
  })
  .catch((e) => {
    if (e instanceof ValidationError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractMetaanalysisForSending(storageMetaanalysis, includeDataValues, email) {
  const retval = {
    id: storageMetaanalysis.id,
    title: storageMetaanalysis.title,
    enteredBy: storageMetaanalysis.enteredBy,
    ctime: storageMetaanalysis.ctime,
    mtime: storageMetaanalysis.mtime,
    reference: storageMetaanalysis.reference,
    description: storageMetaanalysis.description,
    link: storageMetaanalysis.link,
    doi: storageMetaanalysis.doi,
    tags: storageMetaanalysis.tags,
    // todo comments in various places?
  };

  retval.apiurl = apiMetaanalysisURL(email, retval.title);

  // TODO: This will need to be .papers, hiddenExperiments, hiddenPapers etc...
  if (includeDataValues) {
  //   // todo this may not be how the data ends up being encoded
    retval.columnOrder = storageMetaanalysis.columnOrder;
    retval.hiddenCols = storageMetaanalysis.hiddenCols;
  }

  return retval;
}

function extractReceivedMetaanalysis(receivedMetaanalysis) {
  // expecting receivedMetaanalysis to come from JSON.parse()
  const retval = {
    id: tools.string(receivedMetaanalysis.id),                  // identifies the paper to be changed
    title: tools.string(receivedMetaanalysis.title),
    CHECKenteredBy: tools.string(receivedMetaanalysis.enteredBy), // can't be changed but should be checked
    CHECKctime: tools.number(receivedMetaanalysis.ctime),         // can't be changed but should be checked
    // mtime: tools.number(receivedMetaanalysis.mtime),         // will be updated
    reference: tools.string(receivedMetaanalysis.reference),
    description: tools.string(receivedMetaanalysis.description),
    link: tools.string(receivedMetaanalysis.link),
    doi: tools.string(receivedMetaanalysis.doi),
    tags: tools.array(receivedMetaanalysis.tags, tools.string),
    comments: tools.array(receivedMetaanalysis.comments, extractReceivedComment),
    columnOrder: tools.array(receivedMetaanalysis.columnOrder, tools.string),
    hiddenCols: tools.array(receivedMetaanalysis.hiddenCols, tools.string),
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
  .catch(() => next(new InternalError('cannot get columns, why?!?')));
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
