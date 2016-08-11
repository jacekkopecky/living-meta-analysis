/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const tools = require('./tools');
const ValidationError = require('./errors/ValidationError');

const gcloud = require('gcloud')({
  projectId: 'jacek-soc-port-ac-uk',
  keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
});

const datastore = gcloud.datastore({ namespace: 'living-meta-analysis-v2' });


/* users
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
 *   // todo favorites: [ "/id/p/4903", "/id/m/649803", ]
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

/* papers
 *
 *
 *        #####    ##   #####  ###### #####   ####
 *        #    #  #  #  #    # #      #    # #
 *        #    # #    # #    # #####  #    #  ####
 *        #####  ###### #####  #      #####       #
 *        #      #    # #      #      #   #  #    #
 *        #      #    # #      ###### #    #  ####
 *
 *
 */

/* a paper record looks like this:
{
  id: "/id/p/4903",
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

  modifiedBy: 'someoneelse@example.com', // if this is their computed version of this paper
  comments: [
    {
      by: "example@example.com",
      onVersionBy: 'example@example.com',
      text: "the paper presents 5 experiments, only extracting 2 here",
      ctime: 1,
      hidden: false,
      // with onVersionBy and ctime we can view the version on which the comment was done
    },
  ]
  columnOrder: [ '/id/col/12', '/id/col/13', '/id/col/14' ],
  experiments: [
    {
      title: "ex1", // needs to be unique within the paper only
      description: "initial memory experiment",
      enteredBy: 'example@example.com',
      ctime: 2,
      data: {
        "/id/col/12": {  // identifies the column (see below) for which we have a value here
          value: "30",
          ctime: 2,
          enteredBy: 'example@example.com',
          comments: ... as above,

        }
      }
      comments: ... as above,
    }
  ],
}

a column record looks like this: (see /api/columns)
{
  id: '/id/col/12',
  title: 'N',
  description: 'number of participants',
  unit: 'person', // optional
  definedBy: 'jacek.kopecky@port.ac.uk',
  comments: ... as above,
  ctime: 4,
}
  // todo columns
  // todo versioning of the above data?
  //   one approach: keep a stream of timestamped and attributed updates that led to this state?
  //      versions: [
  //        { col: "title", newValue: "Smith96a", ctime: 1},
  //        { col: "published", newValue: "1996-08-00", ctime: 2},
  //        { col: "tags", addedValue: "memory", ctime: 3},
  //        { col: "tags", removedValue: "testing", ctime: 4},
  //        // both entries have an implied enteredBy: the same as in the parent object
  //      ]
  //   but what do we do with contributions/changes by others? what about
  //      versions: [
  //        { col: "title", newValue: "SmithEtAl96a", ctime: 5,
  //          enteredBy: 'someoneElse'},
  //        { col: "title", newValue: "SmithEtAl96a", ctime: 6,
  //          approvesChangeWithCTime: 5},
  //        { col: "title", newValue: "vandalism", ctime: 7, enteredBy: 'troll',
  //          declinedTime: 8},
  //        { col: "tags", addedValue: "mine", ctime: 9,
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

let paperCache;

// get all users immediately on the start of the server
getAllPapers();

function getAllPapers() {
  paperCache = new Promise((resolve, reject) => {
    console.log('getAllPapers: making a datastore request');
    const retval = [];
    datastore.createQuery('Paper').run()
    .on('error', (err) => {
      console.error('error retrieving papers');
      console.error(err);
      setTimeout(getAllPapers, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      retval.push(entity.data);
    })
    .on('end', () => {
      console.log(`getAllPapers: ${retval.length} done`);
      resolve(retval);
    });
  });
}


module.exports.getPapersEnteredBy = (email) => {
  // todo also return papers contributed to by `email`
  return paperCache.then(
    (papers) => papers.filter((p) => p.enteredBy === email)
  );
};

module.exports.getPaperByTitle = (email, title, time) => {
  // todo if time is specified, compute a version as of that time
  if (time) return Promise.reject('getPaperByTitle with time not implemented');

  // todo different users can use different titles for the same thing
  return paperCache
  .then((papers) => {
    for (const p of papers) {
      if (p.title === title) {
        return p;
      }
    }
    return Promise.reject();
  });
};

module.exports.listPapers = () => paperCache;

function deleteCHECKvalues(paper) {
  if (paper !== null && (typeof paper === 'object' || typeof paper === 'function')) {
    for (const key of Object.keys(paper)) {
      if (key.startsWith('CHECK')) delete paper[key];
      else deleteCHECKvalues(paper[key]);
    }
  }
}

// todo trim incoming textual values?

function fillByAndCtimes(paper, origPaper, email) {
  // todo if origPaper != null, update by and ctimes deep in the data structure of paper
  const orig = origPaper || {};
  if (!paper.enteredBy) paper.enteredBy = orig.enteredBy || email;
  if (!paper.ctime) paper.ctime = orig.ctime || tools.uniqueNow();
  fillByAndCtimeInComments(paper.comments, orig.comments, email);
  if (paper.experiments) {
    for (let expIndex = 0; expIndex < paper.experiments.length; expIndex++) {
      const exp = paper.experiments[expIndex];
      const origExp = (orig.experiments || [])[expIndex] || {};
      // todo these values should allow us to construct better patches
      // (e.g. removal of the first experiment)
      if (!exp.enteredBy) exp.enteredBy = origExp.enteredBy || email;
      if (!exp.ctime) exp.ctime = origExp.ctime || tools.uniqueNow();
      fillByAndCtimeInComments(exp.comments, origExp.comments, email);
      for (const col of Object.keys(exp.data || {})) {
        const expCol = exp.data[col];
        const origCol = (origExp.data || {})[col] || {};
        const origColIfSameVal = expCol.value === origCol.value ? origCol : {};
        if (!expCol.enteredBy) expCol.enteredBy = origColIfSameVal.enteredBy || email;
        if (!expCol.ctime) expCol.ctime = origColIfSameVal.ctime || tools.uniqueNow();
        fillByAndCtimeInComments(expCol.comments, origCol.comments, email);
      }
    }
  }
}

function fillByAndCtimeInComments(comments, origComments, email) {
  origComments = origComments || [];
  if (!Array.isArray(comments)) return;
  for (let i = 0; i < comments.length; i++) {
    const com = comments[i];
    const origCom = origComments[i] || {};
    const origComIfSameText = origCom.text === com.text ? origCom : {};
    if (!com.by) com.by = origComIfSameText.by || email;
    if (!com.ctime) com.ctime = origComIfSameText.ctime || tools.uniqueNow();
  }
}

module.exports.savePaper = (paper, email) => {
  // todo multiple users' views on one paper
  // compute this user's version of this paper, as it is in the database
  // compute a diff between what's submitted and the user's version of this paper
  // detect any update conflicts (how?)
  // add the diff to the paper as a changeset
  // update the paper data only if the user is the one who it's enteredBy

  let doAddPaperToCache;

  return paperCache
  .then((papers) => {
    const ctime = tools.uniqueNow();
    let origPaper = null;
    if (!paper.id) {
      paper.id = '/id/p/' + ctime;
      paper.enteredBy = email;
      paper.ctime = paper.mtime = ctime;
      doAddPaperToCache = () => papers.push(paper);
    } else {
      let i = 0;
      for (; i < papers.length; i++) {
        if (papers[i].id === paper.id) { // todo change paperCache to be indexed by id?
          origPaper = papers[i];
          break;
        }
      }

      if (!origPaper) {
        throw new ValidationError('failed savePaper: did not find id ' + paper.id);
      }
      if (email !== origPaper.enteredBy) {
        throw new Error('not implemented saving someone else\'s paper');
      }

      paper.enteredBy = origPaper.enteredBy;
      paper.ctime = origPaper.ctime;
      paper.mtime = tools.uniqueNow();
      doAddPaperToCache = () => { papers[i] = paper; };
    }

    // put ctime and enteredBy on every experiment, datum, and comment that doesn't have them
    fillByAndCtimes(paper, origPaper, email);

    // for now, we choose to ignore if the incoming paper specifies the wrong immutable values here
    // do not save any of the validation values
    deleteCHECKvalues(paper);
  }).then(() => {
    const key = datastore.key(['Paper', paper.id]);
    // this is here until we add versioning on the papers themselves
    const logKey = datastore.key(['Paper', paper.id,
                                  'PaperLog', paper.id + '/' + paper.mtime]);
    console.log('savePaper saving (into Paper and PaperLog)');
    datastore.save(
      [
        { key, data: paper },
        { key: logKey,
          data:
          [
            { name: 'mtime',
              value: paper.mtime },
            { name: 'enteredBy',
              value: email },
            { name: 'paper',
              value: paper,
              excludeFromIndexes: true },
          ] },
      ],
      (err) => {
        if (err) {
          console.error('error saving paper');
          console.error(err);
          throw err;
        }
      }
    );
  })
  .then(() => {
    doAddPaperToCache();
    return paper;
  });
};


/* metaanalyses
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
  // todo versioning of the above data can be like for papers
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


/* columns
 *
 *
 *         ####   ####  #      #    # #    # #    #  ####
 *        #    # #    # #      #    # ##  ## ##   # #
 *        #      #    # #      #    # # ## # # #  #  ####
 *        #      #    # #      #    # #    # #  # #      #
 *        #    # #    # #      #    # #    # #   ## #    #
 *         ####   ####  ######  ####  #    # #    #  ####
 *
 *
 */

module.exports.listColumns = () => columnCache;

const testColumns = {
  '/id/col/12': {
    id: '/id/col/12',
    title: 'No. of Participants',
    description: 'number of participants in the experiment',
    definedBy: 'jacek.kopecky@port.ac.uk',
    type: 'characteristic', // todo: show characteristics first, then results
    ctime: Date.now(),
  },
  '/id/col/13': {
    id: '/id/col/13',
    title: 'Type of Participants',
    description: 'STU means student, CHI means children',
    definedBy: 'jacek.kopecky@port.ac.uk',
    type: 'characteristic',
    ctime: Date.now(),
  },
  '/id/col/14': {
    id: '/id/col/14',
    title: 'Delay of Misinformation',
    description: 'Short is under 24 hours, Long over that',
    definedBy: 'test@port.ac.uk',
    type: 'characteristic',
    ctime: Date.now(),
  },
  '/id/col/15': {
    id: '/id/col/15',
    title: 'Mem/mis/post-warning',
    // eslint-disable-next-line max-len
    description: 'Memory for original event details (%correct) for misled participants in post-warning condition',
    definedBy: 'test@port.ac.uk',
    type: 'result',
    ctime: Date.now(),
  },
};


let columnCache;

// get all users immediately on the start of the server
getAllColumns();

function getAllColumns() {
  columnCache = new Promise((resolve, reject) => {
    console.log('getAllColumns: making a datastore request');
    const retval = testColumns; // should be {}
    datastore.createQuery('Column').run()
    .on('error', (err) => {
      console.error('error retrieving columns');
      console.error(err);
      setTimeout(getAllColumns, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      retval[entity.data.id] = entity.data;
    })
    .on('end', () => {
      console.log(`getAllColumns: ${Object.keys(retval).length} done`);
      resolve(retval);
    });
  });
}
