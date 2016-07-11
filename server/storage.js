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

let userCache;

// get all users immediately on the start of the server
getAllUsers();

function getAllUsers() {
  userCache = new Promise((resolve, reject) => {
    console.log('getAllUsers: making a datastore request');
    const retval = {};
    datastore.createQuery('User').run()
    .on('error', (err) => {
      console.error('error retrieving users');
      console.error(err);
      setTimeout(getAllUsers, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      try {
        retval[entity.data.emails[0].value] = entity.data;
        console.log('getAllUsers: got a user ' + entity.data.emails[0].value);
      } catch (err) {
        console.error('error in a user entity (ignoring)');
        console.error(err);
      }
    })
    .on('end', () => {
      console.log('getAllUsers: done');
      resolve(retval);
    });
  });
}

module.exports.getUser = function getUser(email) {
  if (!email) {
    throw new Error('email parameter required');
  }
  return userCache.then(
    (users) => users[email] || Promise.reject(`user ${email} not found`)
  );
};

module.exports.listUsers = function listUsers() {
  return userCache;
};

module.exports.addUser = function addUser(email, user) {
  if (!email || !user) {
    throw new Error('email/user parameters required');
  }

  return userCache.then(
    (users) => new Promise((resolve, reject) => {
      users[email] = user;
      const key = datastore.key(['User', email]);
      console.log('addUser making a datastore request');
      datastore.save({
        key,
        data: user,
      }, (err) => {
        if (err) {
          console.error('error saving user');
          console.error(err);
          reject(err);
        } else {
          resolve(user);
        }
      });
    })
  );
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
    title: 'Smyth96a',
    enteredBy: 'parkjamapp@gmail.com',
    ctime: 0,
    mtime: 5,
    published: '1996-08-00', // for simply august, precise date unspecified
    description: 'brief description lorem ipsum',
    authors: 'J. Smyth, J. Doe',
    link: 'http://en.wikipedia.org/smith96a',
    doi: '3409/465',
    tags: [
      'memory',
    ],
  },
  {
    id: '/id/a/4904',
    title: 'Juliet04',
    enteredBy: 'jacek.kopecky@port.ac.uk',
    ctime: 0,
    mtime: 5,
    published: '2004-01-17', // for simply august, precise date unspecified
    description: `brief description lorem ipsum brief
                  description lorem ipsum brief description lorem ipsum
                  brief description lorem ipsum`,
    authors: 'J. Juliet, J. Smith',
    link: 'http://en.wikipedia.org/juliet04',
    doi: '3409/465',
    tags: [
      'misinformation',
      'testing',
    ],
  },
];


module.exports.getArticlesEnteredBy = function getArticlesEnteredBy(email) {
  // todo also return articles contributed to by `email`
  return Promise.resolve(articles.filter((a) => a.enteredBy === email));
};

module.exports.getArticleByTitle = (email, title, time) => {
  // todo if time is specified, compute a version as of that time
  if (time) return Promise.reject('getArticleByTitle with time not implemented');

  return new Promise((resolve, reject) => {
    // todo different users can use different titles for the same thing
    for (const a of articles) {
      if (a.title === title) {
        resolve(a);
        return;
      }
    }
    reject();
  });
};

module.exports.listArticles = function listArticles() {
  return Promise.resolve(articles);
};

module.exports.saveArticle = (article) => { // eslint-disable-line arrow-body-style
  // todo

  return new Promise((resolve, reject) => {
    for (let i = 0; i < articles.length; i++) {
      if (articles[i].title === article.title) {
        articles[i] = article;
        resolve(article);
        return;
      }
    }
    reject();
  });
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
    enteredBy: 'jacek.kopecky@port.ac.uk',
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
    enteredBy: 'jacek.kopecky@port.ac.uk',
    ctime: 0,
    mtime: 5,
    published: '2005-01-17', // for simply august, precise date unspecified
    description: `brief description lorem ipsum brief
description lorem ipsum brief description lorem ipsum
brief description lorem ipsum`,
    extraAuthors: 'J. Doe, J. Smith',
  },
];


module.exports.getMetaanalysesEnteredBy = function getMetaanalysesEnteredBy(email) { // eslint-disable-line
  // todo also return metaanalyses contributed to by `email`
  return Promise.resolve(metaanalyses.filter((ma) => ma.enteredBy === email));
};


module.exports.getMetaanalysisByTitle = function getMetaanalysisByTitle(email, title) {
  return new Promise((resolve, reject) => {
    // todo different users can use different titles for the same thing
    for (const ma of metaanalyses) {
      if (ma.title === title) {
        resolve(ma);
        return;
      }
    }
    reject();
  });
};

module.exports.listMetaanalyses = function listMetaanalyses() {
  return Promise.resolve(metaanalyses);
};
