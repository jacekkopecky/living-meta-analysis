'use strict';

const express = require('express');
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');
const storage = require('./storage');

const api = module.exports = express.Router({
  caseSensitive: true,
});

const EMAIL_ADDRESS_RE = module.exports.EMAIL_ADDRESS_RE = '[a-zA-Z.+-]+@[a-zA-Z.+-]+';

api.get('/', (req, res) => res.redirect('/docs/api'));

api.post('/register', GUARD, REGISTER_USER, (req, res) => res.sendStatus(200));
api.get(`/profile/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);


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
    storage.getUser(email, (err, user) => {
      if (!user) {
        user = req.user;
        // creation time - when the user was first registered
        user.ctime = Date.now();
        storage.addUser(email, user);
        console.log('registered user ' + email);
      }
      // access time - not currently saved in the database
      user.atime = Date.now();

      next();
    });
  } else {
    next();
  }
}

function returnUserProfile(req, res, next) {
  storage.getUser(req.params.email, (err, user) => {
    if (!user) {
      next(new NotFoundError());
      return;
    }

    const retval = {
      displayName: user.displayName,
      name: user.name,
      email: user.emails[0].value,
      photos: user.photos,
      joined: user.ctime,
    };
    res.json(retval);
  });
}


module.exports.checkUserExists = function (req, res, next) {
  storage.getUser(req.params.email, (err, user) => {
    if (user) next();
    else next(new NotFoundError());
  });
};
