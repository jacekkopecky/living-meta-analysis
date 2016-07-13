'use strict';

const express = require('express');
const jsonBodyParser = require('body-parser').json();
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
const UnauthorizedError = require('./errors/UnauthorizedError');
const InternalError = require('./errors/InternalError');
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
api.get('/toparticles', REGISTER_USER, listTopArticles);
api.get('/topmetaanalyses', REGISTER_USER, listTopMetaanalyses);

api.get(`/profile/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);

api.get(`/articles/:email(${EMAIL_ADDRESS_RE})`,
        REGISTER_USER, listArticlesForUser);
api.get(`/articles/:email(${EMAIL_ADDRESS_RE})/:title/`,
        REGISTER_USER, getArticleVersion);
api.get(`/articles/:email(${EMAIL_ADDRESS_RE})/:title/:time([0-9]+)/`,
        REGISTER_USER, getArticleVersion);
api.post(`/articles/:email(${EMAIL_ADDRESS_RE})/:title/`,
        GUARD, SAME_USER, jsonBodyParser, saveArticle);

// api.get(/)

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
    .catch(() => storage.getArticleByTitle(email, title))
    .then(() => resolve('article'))
    .catch((err) => reject(err));
  });
};

function listArticlesForUser(req, res, next) {
  storage.getArticlesEnteredBy(req.params.email)
  .then((articles) => {
    if (articles.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    articles.forEach((a) => {
      retval.push(extractArticleForSending(a));
    });
    res.json(retval);
  })
  .catch(() => next(new NotFoundError()));
}

function getArticleVersion(req, res, next) {
  storage.getArticleByTitle(req.params.email, req.params.title, req.params.time)
  .then((a) => {
    res.json(extractArticleForSending(a, true));
  })
  .catch((e) => {
    console.error(e);
    next(new NotFoundError());
  });
}

function saveArticle(req, res, next) {
  // extract from incoming data stuff that is allowed
  storage.saveArticle(extractReceivedArticle(req.body), req.user.emails[0].value)
  .then((a) => {
    res.json(extractArticleForSending(a, true));
  })
  .catch((e) => {
    next(new InternalError(e));
  });
}

function extractArticleForSending(storageArticle, includeDataValues) {
  const retval = {
    id: storageArticle.id,
    title: storageArticle.title,
    enteredBy: storageArticle.enteredBy,
    ctime: storageArticle.ctime,
    mtime: storageArticle.mtime,
    published: storageArticle.published,
    description: storageArticle.description,
    authors: storageArticle.authors,
    link: storageArticle.link,
    doi: storageArticle.doi,
    tags: storageArticle.tags,
  };

  if (includeDataValues) {
    // todo this may not be how the data ends up being encoded
    retval.experiments = storageArticle.experiments;
  }

  return retval;
}

function extractReceivedArticle(receivedArticle) {
  // expecting receivedArticle to come from JSON.parse()
  const retval = {
    id: tools.string(receivedArticle.id),                  // identifies the article to be changed
    title: tools.string(receivedArticle.title),
    // enteredBy: tools.string(receivedArticle.enteredBy), // can't be changed
    // ctime: tools.number(receivedArticle.ctime),         // can't be changed
    // mtime: tools.number(receivedArticle.mtime),         // will be updated
    published: tools.string(receivedArticle.published),
    description: tools.string(receivedArticle.description),
    authors: tools.string(receivedArticle.authors),
    link: tools.string(receivedArticle.link),
    doi: tools.string(receivedArticle.doi),
    tags: tools.array(receivedArticle.tags, tools.string),
    experiments: tools.array(receivedArticle.experiments, extractReceivedExperiment),
  };

  // todo comments and anything else recently added to the data

  return retval;
}

function extractReceivedExperiment(receivedExperiment) {
  const retval = {
    title: tools.string(receivedExperiment.title),
    description: tools.string(receivedExperiment.description),
    data: tools.assoc(receivedExperiment.data, extractReceivedExperimentDatum),
    // todo comments
  };
  return retval;
}

function extractReceivedExperimentDatum(receivedDatum) {
  const retval = {
    value: tools.string(receivedDatum.value),
    // todo comments
  };
  return retval;
}

function listTopArticles(req, res, next) {
  storage.listArticles()
  .then((articles) => {
    const retval = [];
    for (const a of articles) {
      retval.push({
        title: a.title,
        enteredBy: a.enteredBy,
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
