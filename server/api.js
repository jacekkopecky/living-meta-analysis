'use strict';

const express = require('express');
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
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
api.get(`/profile/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);

api.get(`/articles/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, listArticles);
api.get(`/articles/:email(${EMAIL_ADDRESS_RE})/:title/`, REGISTER_USER, getArticle);

api.get(`/metaanalyses/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, listMetaanalyses);


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

function listArticles(req, res, next) {
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

function getArticle(req, res, next) {
  storage.getArticleByTitle(req.params.email, req.params.title)
  .then((a) => {
    res.json(extractArticleForSending(a));
  })
  .catch(() => next(new NotFoundError()));
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
    retval.data = storageArticle.data;
  }

  return retval;
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
function listMetaanalyses(req, res, next) {
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
