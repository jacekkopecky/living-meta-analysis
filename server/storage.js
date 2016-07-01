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

const datastore = gcloud.datastore({ namespace: 'living-meta-analysis-v1' });


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

/* a user record looks like this:
 * {
 *   "id": "100380000000000000000",
 *   "ctime": 1467367646989,
 *   "provider": "accounts.google.com",
 *   "emails": [
 *     {
 *       "value": "example@gmail.com",
 *       "verified": true
 *     }
 *   ],
 *   "displayName": "Example Exampleson",
 *   "name": {
 *     "givenName": "Example",
 *     "familyName": "Exampleson"
 *   },
 *   "photos": [
 *     {
 *       "value": "https://lh5.googleusercontent.com/EXAMPLE/photo.jpg"
 *     }
 *   ]
 * }
 */

const userCache = {};
let userCacheReady = false;
let userCacheRefreshing = false;
let userCacheRequests = [];

function getAllUsers() {
  if (userCacheReady || userCacheRefreshing) return;
  userCacheRefreshing = true;

  console.log('getAllUsers: making a datastore request');
  datastore.createQuery('User').run()
    .on('error', (err) => {
      console.error('error retrieving user');
      console.error(err);
      userCacheRequests.forEach((cb) => cb(err));
      userCacheRequests = [];
      userCacheRefreshing = false;
    })
    .on('data', (entity) => {
      try {
        userCache[entity.data.emails[0].value] = entity.data;
        console.log('getAllUsers: got a user ' + entity.data.emails[0].value);
      } catch (err) {
        console.error('error in a user entity');
        console.error(err);
      }
    })
    .on('end', () => {
      console.log('getAllUsers: done');
      userCacheRequests.forEach((cb) => cb());
      userCacheRequests = [];
      userCacheRefreshing = false;
      userCacheReady = true;
    });
}

getAllUsers();

module.exports.getUser = function getUser(email, cb) {
  if (!email || !cb) {
    setImmediate(cb, new Error('email/cb parameters required'));
    return;
  }
  if (!userCacheReady) {
    userCacheRequests.push((err) => {
      if (err) cb(err);
      else getUser(email, cb);
    });
    getAllUsers();
    return;
  }
  setImmediate(cb, null, userCache[email]);
};

module.exports.addUser = function addUser(email, user, cb) {
  if (!email || !user) {
    setImmediate(cb, new Error('email/user parameters required'));
    return;
  }
  if (!userCacheReady) {
    userCacheRequests.push((err) => {
      if (err) cb(err);
      else addUser(email, user, cb);
    });
    getAllUsers();
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
