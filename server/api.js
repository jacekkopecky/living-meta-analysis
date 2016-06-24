'use strict';

const express = require('express');
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');

const api = module.exports = express.Router({
  caseSensitive: true,
});

api.get('/', (req, res) => res.redirect('/docs/api'));

// todo only for testing
api.get('/someinfo',
  (req, res) =>
    setTimeout(() => res.json(req.user || { error: 'no user', extra: req.userError }), 500)
  );

api.get(/\/profile\/([a-zA-Z.+-]+@[a-zA-Z.+-]+)/, GUARD, REGISTER_USER, returnUserProfile);


/*
 *         #    #  ####  ###### #####   ####
 *         #    # #      #      #    # #
 *         #    #  ####  #####  #    #  ####
 *         #    #      # #      #####       #
 *         #    # #    # #      #   #  #    #
 *          ####   ####  ###### #    #  ####
 */
const users = {};

function REGISTER_USER(req, res, next) {  // eslint-disable-line no-unused-vars
  if (req.user) {
    // todo this needs to be in a database
    // and if it's already there, don't remove any extra properties we know about the user
    // we could have last login?
    users[req.user.emails[0].value] = req.user;
    console.log('registered ' + req.user.emails[0].value);
  }

  next();
}

function returnUserProfile(req, res) {
  const user = users[req.params[0]];
  if (!user) {
    throw new NotFoundError();
  } else {
    const retval = {
      displayName: user.displayName,
      name: user.name,
      email: user.emails[0].value,
      photos: user.photos,
    };
    res.json(retval);
  }
}


module.exports.checkUserExists = function (req, res, next) {
  const email = req.params.email;
  if (users[email]) next();
  else throw new NotFoundError();
};
