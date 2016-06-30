/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const gcloud = require('gcloud')({
  projectId: 'jacek-soc-port-ac-uk',
  keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
});

const datastore = gcloud.datastore();


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

const userCache = {};

module.exports.getUser = function getUser(email, cb) {
  if (!email || !cb) {
    setImmediate(cb, new Error('email/cb parameters required'));
    return;
  }
  if (userCache[email]) {
    setImmediate(cb, null, userCache[email]);
    return;
  }

  const key = datastore.key(['User', email]);

  console.log('getUser making a datastore request');
  datastore.get(key, (err, entity) => {
    if (err) {
      console.error('error retrieving user');
      console.error(err);
      return cb(err);
    }

    if (entity) userCache[email] = entity.data;

    return cb(null, userCache[email]);
  });
};

module.exports.addUser = function addUser(email, user, cb) {
  if (!email || !user) {
    setImmediate(cb, new Error('email/user parameters required'));
    return;
  }
  userCache[email] = user;

  const key = datastore.key(['User', email]);

  console.log('addUser making a datastore request');
  datastore.save({
    key,
    data: user,
  }, (err) => {
    if (err) {
      console.error('error saving user');
      console.error(err);
      if (cb) cb(err);
    }
  });
};
