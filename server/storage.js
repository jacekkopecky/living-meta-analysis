/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const tools = require('./tools');

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

module.exports.getUser = (email) => {
  if (!email) {
    throw new Error('email parameter required');
  }
  return userCache.then(
    (users) => users[email] || Promise.reject(`user ${email} not found`)
  );
};

module.exports.listUsers = () => {
  return userCache;
};

module.exports.addUser = (email, user) => {
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
  published: "1996-08, Intl J of Psy 40(4):7",
  description: "brief description lorem ipsum",
  authors: "J. Smith, J. Doe",
  link: "http:...",
  doi: "3409/465",
  tags: [
    "memory",
    "misinformation",
  ],

  modifiedBy: 'someoneelse@example.com', // if this is their computed version of this article
  comments: [
    {
      by: "example@example.com",
      onVersionBy: 'example@example.com',
      text: "the article presents 5 experiments, only extracting 2 here",
      ctime: 1,
      hidden: false,
      // we can view the version on which the comment was done
    },
  ]
  experiments: [
    {
      title: "ex1", // needs to be unique within the article only
      description: "initial memory experiment",
      enteredBy: 'example@example.com',
      ctime: 2,
      data: {
        "/id/p/12": {  // identifies the property (see below) for which we have a value here
          value: "30",
          ctime: 2,
          enteredBy: 'example@example.com',
          comments: ... as above,

        }
      }
    }
  ]
}

a property record looks like this: (see /api/properties)
{
  id: '/id/p/12',
  title: 'N',
  description: 'number of participants',
  unit: 'person', // optional
  definedBy: 'jacek.kopecky@port.ac.uk',
}
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
 */

let articleCache;

// get all users immediately on the start of the server
getAllArticles();

function getAllArticles() {
  articleCache = new Promise((resolve, reject) => {
    console.log('getAllArticles: making a datastore request');
    const retval = [];
    datastore.createQuery('Article').run()
    .on('error', (err) => {
      console.error('error retrieving articles');
      console.error(err);
      setTimeout(getAllArticles, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      retval.push(entity.data);
    })
    .on('end', () => {
      console.log(`getAllArticles: ${retval.length} done`);
      resolve(retval);
    });
  });
}


module.exports.getArticlesEnteredBy = (email) => {
  // todo also return articles contributed to by `email`
  return articleCache.then(
    (articles) => articles.filter((a) => a.enteredBy === email)
  );
};

module.exports.getArticleByTitle = (email, title, time) => {
  // todo if time is specified, compute a version as of that time
  if (time) return Promise.reject('getArticleByTitle with time not implemented');

  // todo different users can use different titles for the same thing
  return articleCache
  .then((articles) => {
    for (const a of articles) {
      if (a.title === title) {
        return a;
      }
    }
    return Promise.reject();
  });
};

module.exports.listArticles = () => articleCache;

module.exports.saveArticle = (article, email) => {
  // todo multiple users' views on one article
  // compute this user's version of this article, as it is in the database
  // compute a diff between what's submitted and the user's version of this article
  // detect any update conflicts (how?)
  // add the diff to the article as a changeset
  // update the article data only if the user is the one who it's enteredBy

  let doAddArticleToCache;

  return articleCache
  .then((articles) => {
    if (!article.id) {
      article.id = '/id/a/' + tools.uniqueNow();
      article.enteredBy = email;
      article.ctime = article.mtime = tools.uniqueNow();
      doAddArticleToCache = () => articles.push(article);
    } else {
      let origArticle = null;
      let i = 0;
      for (; i < articles.length; i++) {
        if (articles[i].id === article.id) { // todo change articleCache to be indexed by id?
          origArticle = articles[i];
          break;
        }
      }

      if (!origArticle) {
        throw new Error('failed saveArticle: did not found id ' + article.id);
      }
      if (email !== origArticle.enteredBy) {
        throw new Error('not implemented saving someone else\'s article');
      }

      article.enteredBy = origArticle.enteredBy;
      article.ctime = origArticle.ctime;
      article.mtime = tools.uniqueNow();
      doAddArticleToCache = () => { articles[i] = article; };
    }
  }).then(() => {
    const key = datastore.key(['Article', article.id]);
    // this is here until we add versioning on the articles themselves
    const logKey = datastore.key(['Article', article.id,
                                  'ArticleLog', article.id + '/' + article.mtime]);
    console.log('saveArticle saving (into Article and ArticleLog)');
    datastore.save(
      [
        { key, data: article },
        { key: logKey,
          data:
          [
            { name: 'mtime',
              value: article.mtime },
            { name: 'enteredBy',
              value: email },
            { name: 'article',
              value: article,
              excludeFromIndexes: true },
          ] },
      ],
      (err) => {
        if (err) {
          console.error('error saving article');
          console.error(err);
          throw err;
        }
      }
    );
  })
  .then(() => {
    doAddArticleToCache();
    return article;
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


module.exports.getMetaanalysesEnteredBy = (email) => {
  // todo also return metaanalyses contributed to by `email`
  return Promise.resolve(metaanalyses.filter((ma) => ma.enteredBy === email));
};


module.exports.getMetaanalysisByTitle = (email, title) => {
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

module.exports.listMetaanalyses = () => {
  return Promise.resolve(metaanalyses);
};
