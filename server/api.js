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

const EMAIL_ADDRESS_RE = module.exports.EMAIL_ADDRESS_RE = '[a-zA-Z.+-]+@[a-zA-Z.+-]+';

/*
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

api.get(`/papers/:email(${EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listPapersForUser);
api.get(`/papers/:email(${EMAIL_ADDRESS_RE})/:title/`,
        REGISTER_USER, getPaperVersion);
api.get(`/papers/:email(${EMAIL_ADDRESS_RE})/:title/:time([0-9]+)/`,
        REGISTER_USER, getPaperVersion);
api.post(`/papers/:email(${EMAIL_ADDRESS_RE})/:title/`,
        GUARD, SAME_USER, jsonBodyParser, savePaper);

// api.get(/api/columns)

api.get(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, listMetaanalysesForUser);


/*
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


/*
 *
 *
 *          ##   #####  ##### #  ####  #      ######  ####
 *         #  #  #    #   #   # #    # #      #      #
 *        #    # #    #   #   # #      #      #####   ####
 *        ###### #####    #   # #      #      #           #
 *        #    # #   #    #   # #    # #      #      #    #
 *        #    # #    #   #   #  ####  ###### ######  ####
 *
 *
 */
module.exports.getKindForTitle = function getKindForTitle(email, title) {
  return new Promise((resolve, reject) => {
    storage.getMetaanalysisByTitle(email, title)
    .then(() => resolve('metaanalysis'))
    .catch(() => storage.getPaperByTitle(email, title))
    .then(() => resolve('paper'))
    .catch((err) => reject(err));
  });
};

function listPapersForUser(req, res, next) {
  storage.getPapersEnteredBy(req.params.email)
  .then((papers) => {
    if (papers.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    papers.forEach((p) => {
      retval.push(extractPaperForSending(p));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getPaperVersion(req, res, next) {
  storage.getPaperByTitle(req.params.email, req.params.title, req.params.time)
  .then((p) => {
    res.json(extractPaperForSending(p, true));
  })
  .catch((e) => {
    console.error(e);
    next(new NotFoundError());
  });
}

function savePaper(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.savePaper(extractReceivedPaper(req.body), req.user.emails[0].value)
  .then((p) => {
    res.json(extractPaperForSending(p, true));
  })
  .catch((e) => {
    if (e instanceof ValidationError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  });
}

function extractPaperForSending(storagePaper, includeDataValues) {
  const retval = {
    id: storagePaper.id,
    title: storagePaper.title,
    enteredBy: storagePaper.enteredBy,
    ctime: storagePaper.ctime,
    mtime: storagePaper.mtime,
    published: storagePaper.published,
    description: storagePaper.description,
    authors: storagePaper.authors,
    link: storagePaper.link,
    doi: storagePaper.doi,
    tags: storagePaper.tags,
  };

  if (includeDataValues) {
    // todo this may not be how the data ends up being encoded
    retval.experiments = storagePaper.experiments;
    retval.columnOrder = storagePaper.columnOrder;
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
    published: tools.string(receivedPaper.published),
    description: tools.string(receivedPaper.description),
    authors: tools.string(receivedPaper.authors),
    link: tools.string(receivedPaper.link),
    doi: tools.string(receivedPaper.doi),
    tags: tools.array(receivedPaper.tags, tools.string),
    experiments: tools.array(receivedPaper.experiments, extractReceivedExperiment),
    comments: tools.array(receivedPaper.comments, extractReceivedComment),
    columnOrder: tools.array(receivedPaper.columnOrder, tools.string),
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


/*
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
  // todo by email
  storage.getMetaanalysesEnteredBy(req.params.email)
  .then((mas) => {
    if (mas.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    mas.forEach((m) => {
      const retMA = {
        id: m.id,
        title: m.title,
        enteredBy: m.enteredBy,
        ctime: m.ctime,
        mtime: m.mtime,
        published: m.published,
        description: m.description,
        extraAuthors: m.extraAuthors,
        tags: m.tags,
      };
      retval.push(retMA);
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
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
