'use strict';

const express = require('express');
const GUARD = require('simple-google-openid').guardMiddleware({ realm: 'accounts.google.com' });

const NotFoundError = require('./errors/NotFoundError');

const api = module.exports = express.Router({
  caseSensitive: true,
});

const EMAIL_ADDRESS_RE = module.exports.EMAIL_ADDRESS_RE = '[a-zA-Z.+-]+@[a-zA-Z.+-]+';

api.get('/', (req, res) => res.redirect('/docs/api'));

api.post('/register', GUARD, REGISTER_USER, (req, res) => res.sendStatus(200));
api.get(`/profile/:email(${EMAIL_ADDRESS_RE})`, REGISTER_USER, returnUserProfile);


/*
 *         #    #  ####  ###### #####   ####
 *         #    # #      #      #    # #
 *         #    #  ####  #####  #    #  ####
 *         #    #      # #      #####       #
 *         #    # #    # #      #   #  #    #
 *          ####   ####  ###### #    #  ####
 */
const users = { 'a@b': {
  displayName: 'Example Exampleson',
  name: {
    familyName: 'Ex',
    givenName: 'Ample',
  },
  emails: [
    {
      value: 'a@b',
    },
  ],
  id: '112523269168211188731',
  provider: 'accounts.google.com',
  ctime: 0,
} };

function REGISTER_USER(req, res, next) {  // eslint-disable-line no-unused-vars
  if (req.user) {
    // todo this needs to be in a database
    // and if it's already there, don't remove any extra properties we know about the user
    // we could have last login?
    const email = req.user.emails[0].value;
    let user = users[email];
    if (!user) {
      user = users[email] = req.user;
      // creation time - when the user was first registered
      user.ctime = Date.now();
      console.log('registered user ' + email);
    }
    // access time
    user.atime = Date.now();
  }

  next();
}

function returnUserProfile(req, res) {
  const user = users[req.params.email];
  if (!user) {
    throw new NotFoundError();
  } else {
    const retval = {
      displayName: user.displayName,
      name: user.name,
      email: user.emails[0].value,
      photos: user.photos,
      joined: user.ctime,
    };
    res.json(retval);
  }
}


module.exports.checkUserExists = function (req, res, next) {
  const email = req.params.email;
  if (users[email]) next();
  else throw new NotFoundError();
};
