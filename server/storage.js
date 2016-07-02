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
 *       "value": "example@example.com",
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
 *   // todo favorites: [ "/id/a/4903", "/id/a/649803", ]
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
      userCacheReady = true;
      userCacheRequests.forEach((cb) => cb());
      userCacheRequests = [];
      userCacheRefreshing = false;
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

module.exports.listUsers = function listUsers(cb) {
  if (!cb) {
    setImmediate(cb, new Error('cb parameter required'));
    return;
  }
  if (!userCacheReady) {
    userCacheRequests.push((err) => {
      if (err) cb(err);
      else listUsers(cb);
    });
    getAllUsers();
    return;
  }
  setImmediate(cb, null, userCache);
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

/*
 *
 *
 *       ##   #####  ##### #  ####  #      ######  ####
 *      #  #  #    #   #   # #    # #      #      #
 *     #    # #    #   #   # #      #      #####   ####
 *     ###### #####    #   # #      #      #           #
 *     #    # #   #    #   # #    # #      #      #    #
 *     #    # #    #   #   #  ####  ###### ######  ####
 *
 *
 */

/* an article record looks like this:
{
  id: "/id/a/4903",
  title: "Smith96a",
  enteredBy: "example@example.com",
  ctime: 0,
  mtime: 5,
  published: "1996-08-00", // for simply august, precise date unspecified
  description: "brief description lorem ipsum",
  authors: "J. Smith, J. Doe",
  link: "http:...",
  doi: "3409/465",
  tags: [
    "memory",
    "misinformation",
  ],
  // todo properties
  // todo versioning of the above data?
  //   one approach: keep a stream of timestamped and attributed updates that led to this state?
  //      versions: [
  //        { prop: "title", newValue: "Smith96a", ctime: 1},
  //        { prop: "published", newValue: "1996-08-00", ctime: 2},
  //        { prop: "tags", addedValue: "memory", ctime: 3},
  //        { prop: "tags", removedValue: "testing", ctime: 4},
  //        // both entries have an implied enteredBy: the same as in the parent object
  //      ]
  //   but what do we do with contributions/changes by others? what about
  //      versions: [
  //        { prop: "title", newValue: "SmithEtAl96a", ctime: 5,
  //          enteredBy: 'someoneElse'},
  //        { prop: "title", newValue: "SmithEtAl96a", ctime: 6,
  //          approvesChangeWithCTime: 5},
  //        { prop: "title", newValue: "vandalism", ctime: 7, enteredBy: 'troll',
  //          declinedTime: 8},
  //        { prop: "tags", addedValue: "mine", ctime: 9,
  //          enteredBy: 'someoneElse'},
  //      ]
  //
  // when displaying histories, group changes by the same author that happen in quick succession
  // approved changes become a "PR merge"
  //   an approval repeats the value so that the merge can still make little changes
  // when computing "current state", for the orig. author it's simply the current state
  //   and for anyone else it's the current state plus all their non-approved changes
  //   but we need to highlight where the orig. author made a change after our non-approved change
}
 */

const articles = [
  {
    id: '/id/a/4903',
    title: 'Smith96a',
    enteredBy: 'example@example.com',
    ctime: 0,
    mtime: 5,
    published: '1996-08-00', // for simply august, precise date unspecified
    description: 'brief description lorem ipsum',
    authors: 'J. Smith, J. Doe',
    link: 'http:...',
    doi: '3409/465',
    tags: [
      'memory',
    ],
  },
  {
    id: '/id/a/4904',
    title: 'Juliet04',
    enteredBy: 'example@example.com',
    ctime: 0,
    mtime: 5,
    published: '2004-01-17', // for simply august, precise date unspecified
    description: `brief description lorem ipsum brief
                  description lorem ipsum brief description lorem ipsum
                  brief description lorem ipsum`,
    authors: 'J. Doe, J. Smith',
    link: 'http:...',
    doi: '3409/465',
    tags: [
      'misinformation',
      'testing',
    ],
  },
];


module.exports.getArticlesEnteredBy = function getArticlesEnteredBy(email, cb) {
  setImmediate(cb, null, articles);
};


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

/* a meta-analysis record looks like this:
{
  id: "/id/m/4904",
  title: "misinformation08",
  enteredBy: "example@example.com",
  ctime: 0,
  mtime: 5,
  published: "2010-04-12",
  description: "brief description lorem ipsum",
  extraAuthors: "J. Smith, J. Doe",
  tags: [
    "memory",
    "misinformation",
  ],
  // todo various extra things
  // todo versioning of the above data can be like for articles
}
 */

const metaanalyses = [
  {
    id: '/id/m/4904',
    title: 'memory96',
    enteredBy: 'example@example.com',
    ctime: 0,
    mtime: 5,
    published: '1997-08-00', // for simply august, precise date unspecified
    description: 'brief description lorem ipsum',
    extraAuthors: 'J. Smith, J. Doe',
    tags: [
      'memory',
    ],
  },
  {
    id: '/id/m/4905',
    title: 'misinformation04',
    enteredBy: 'example@example.com',
    ctime: 0,
    mtime: 5,
    published: '2005-01-17', // for simply august, precise date unspecified
    description: `brief description lorem ipsum brief
                  description lorem ipsum brief description lorem ipsum
                  brief description lorem ipsum`,
    extraAuthors: 'J. Doe, J. Smith',
  },
];


module.exports.getMetaanalysesEnteredBy = function getMetaanalysesEnteredBy(email, cb) {
  setImmediate(cb, null, metaanalyses);
};
