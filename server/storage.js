/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const tools = require('./tools');
const ValidationError = require('./errors/ValidationError');

const google = require('./google');
const gcloud = google.project();

const datastore = google.datastore(gcloud, 'living-meta-analysis-v2');

const TITLE_RE = module.exports.TITLE_RE = '[a-zA-Z0-9.-]+';
const TITLE_REXP = new RegExp(`^${TITLE_RE}$`);

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
  reference: "J. Smith, J. Doe, 1996-08, Intl J of Psy 40(4):7",
  description: "brief description lorem ipsum",
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
  //        { col: "reference", newValue: "1996-08-00", ctime: 2},
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
const paperTitles = [];

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
      retval.push(migratePaper(entity.data));
      paperTitles.push(entity.data.title);
    })
    .on('end', () => {
      console.log(`getAllPapers: ${retval.length} done`);
      resolve(retval);
    });
  });
}

/*
 * change paper from an old format to the new one, if need be
 */
function migratePaper(paper) {
  // 2016-08-19: remove authors and published fields in favor of a textual reference field
  if (!paper.reference && (paper.authors || paper.published)) {
    paper.reference = paper.authors || '';
    if (paper.authors && paper.published) paper.reference += ', ';
    paper.reference += paper.published || '';
    delete paper.authors;
    delete paper.published;
  }
  return paper;
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
  if (title === 'new') return Promise.resolve(newPaper(email));
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

function newPaper(email) {
  const time = tools.uniqueNow();
  return {
    enteredBy: email,
    ctime: time,
    mtime: time,
  };
}

module.exports.listPapers = () => paperCache;
module.exports.listPaperTitles = () => paperCache.then(() => paperTitles);

// todo trim incoming textual values?

function fillByAndCtimes(paper, origPaper, email) {
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

function checkForDisallowedChanges(paper, origPaper, columns) {
  // todo really, this should use a diff format and check that all diffs are allowed
  //   this will be a diff from the user's last version to the incoming version,
  //   not from the existing version to the incoming version,
  //   so that collaborative concurrent updates are allowed
  //   so for example adding a comment number 9 will become adding a comment
  //   and if comments 9 and 10 were already added by other users, we will add comment 11
  // but for now we don't have the diffs, so
  //   do the checks we can think of for changes that wouldn't be allowed
  // for example, we can't really allow removing values because we don't allow removing comments
  // todo comment mtimes

  origPaper = origPaper || {};

  // check that title hasn't changed or if it has, that it is unique
  if (paper.title !== origPaper.title) {
    if (!TITLE_REXP.test(paper.title)) {
      throw new ValidationError('paper title cannot contain spaces or special characters');
    }
    if (paperTitles.indexOf(paper.title) !== -1) {
      throw new ValidationError('paper title must be unique');
    }
    if (paper.title === 'new') {
      throw new ValidationError('"new" is a reserved paper name');
    }
  }

  // check that every experiment has at least the data values that were there originally
  // check that only last comment by a given user has changed, if any
  if (paper.experiments) {
    const expTitles = {};

    for (let expIndex = 0; expIndex < paper.experiments.length; expIndex++) {
      const exp = paper.experiments[expIndex];
      const origExp = (origPaper.experiments || [])[expIndex] || {};

      // check experiment titles are there and unique for this paper
      if (!TITLE_REXP.test(exp.title)) {
        throw new ValidationError('experiment title cannot contain spaces or special characters');
      }
      if (exp.title in expTitles) {
        throw new ValidationError('experiment titles must be unique');
      }
      expTitles[exp.title] = true;

      if (origExp.data) {
        if (!exp.data) throw new ValidationError('cannot remove experiment data array');

        for (const origDataKey of Object.keys(origExp.data)) {
          if (!(origDataKey in exp.data)) {
            throw new ValidationError('cannot remove experiment data');
          }

          const comments = exp.data[origDataKey].comments;
          const origComments = origExp.data[origDataKey].comments;

          if (origComments) {
            if (!comments || comments.length < origComments.length) {
              throw new ValidationError('cannot remove comments');
            }

            const changedCommentByOwner = {};
            for (let i = 0; i < origComments.length; i++) {
              const comment = comments[i];
              const origComment = origComments[i];
              if (comment.CHECKby !== origComment.by) {
                throw new ValidationError('cannot change comment owner');
              }
              if (comment.CHECKby in changedCommentByOwner) {
                throw new ValidationError('cannot edit comment before the last by a given owner');
              }
              if (comment.text !== origComment.text) {
                changedCommentByOwner[comment.CHECKby] = 1;
              }
            }
          }
        }
      }
      if (exp.data) {
        for (const dataKey of Object.keys(exp.data)) {
          if (!(dataKey in columns)) {
            throw new ValidationError('cannot include data with unknown column ID ' + dataKey);
          }
        }
      }
    }
  }
}

let currentSave = Promise.resolve();

module.exports.savePaper = (paper, email, origTitle) => {
  // todo multiple users' views on one paper
  // compute this user's version of this paper, as it is in the database
  // compute a diff between what's submitted and the user's version of this paper
  // detect any update conflicts (how?)
  // add the diff to the paper as a changeset
  // update the paper data only if the user is the one who it's enteredBy
  // only allow editing a comment if it's the last one by this user
  //   (must allow editing the last comment by this user in case in the meantime another user
  //    has added another comment)

  let doAddPaperToCache;

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create papers with the same title

  let columns;

  currentSave = tools.waitForPromise(currentSave)
  .then(() => columnCache)
  .then((cols) => { columns = cols; })
  .then(() => paperCache)
  .then((papers) => {
    // prepare the paper for saving
    const ctime = tools.uniqueNow();
    let origPaper = null;
    if (!paper.id) {
      paper.id = '/id/p/' + ctime;
      paper.enteredBy = email;
      paper.ctime = paper.mtime = ctime;
      doAddPaperToCache = () => { papers.push(paper); paperTitles.push(paper.title); };
    } else {
      let i = 0;
      for (; i < papers.length; i++) {
        if (papers[i].id === paper.id) { // todo change paperCache to be indexed by id?
          origPaper = papers[i];
          break;
        }
      }

      if (!origPaper || origTitle !== origPaper.title) {
        throw new ValidationError(
          `failed savePaper: did not find id ${paper.id} with title ${origTitle}`);
      }
      if (email !== origPaper.enteredBy) {
        throw new Error('not implemented saving someone else\'s paper');
      }

      paper.enteredBy = origPaper.enteredBy;
      paper.ctime = origPaper.ctime;
      paper.mtime = tools.uniqueNow();
      doAddPaperToCache = () => {
        // put the paper in the cache where the original paper was
        papers[i] = paper;
        // replace in paperTitles the old title of the paper with the new title
        if (origPaper.title !== paper.title) {
          let titleIndex = paperTitles.indexOf(origPaper.title);
          if (titleIndex === -1) {
            titleIndex = paperTitles.length;
            console.warn(`for some reason, title ${origPaper.title} was missing in paperTitles`);
          }
          paperTitles[titleIndex] = paper.title;
        }
      };
    }

    // validate incoming data
    checkForDisallowedChanges(paper, origPaper, columns);

    // put ctime and enteredBy on every experiment, datum, and comment that doesn't have them
    fillByAndCtimes(paper, origPaper, email);

    // for now, we choose to ignore if the incoming paper specifies the wrong immutable values here
    // do not save any of the validation values
    tools.deleteCHECKvalues(paper);

    // save tha paper in the data store
    const key = datastore.key(['Paper', paper.id]);
    // this is here until we add versioning on the papers themselves
    const logKey = datastore.key(['Paper', paper.id,
                                  'PaperLog', paper.id + '/' + paper.mtime]);
    console.log('savePaper saving (into Paper and PaperLog)');
    return new Promise((resolve, reject) => {
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
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  })
  .then(() => {
    doAddPaperToCache();
    return paper;
  });

  return currentSave;
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

const COLUMN_TYPES = ['characteristic', 'result'];

let columnCache;

// get all users immediately on the start of the server
getAllColumns();

function getAllColumns() {
  columnCache = new Promise((resolve, reject) => {
    console.log('getAllColumns: making a datastore request');
    const retval = {};
    datastore.createQuery('Column').run()
    .on('error', (err) => {
      console.error('error retrieving columns');
      console.error(err);
      setTimeout(getAllColumns, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      try {
        retval[entity.data.id] = entity.data;
        console.log('getAllColumns: got a column ' + entity.data.id);
      } catch (err) {
        console.error('error in a column entity (ignoring)');
        console.error(err);
      }
    })
    .on('end', () => {
      console.log(`getAllColumns: ${Object.keys(retval).length} done`);
      resolve(retval);
    });
  });
}

module.exports.saveColumn = (recvCol, email) => {
  // todo identify the columns to be saved and actually save them
  return columnCache
  .then((columns) => {
    // first validate title and type
    if (!recvCol.title || !recvCol.title.trim() || COLUMN_TYPES.indexOf(recvCol.type) === -1) {
      throw new ValidationError('column invalid: must have title and allowed type');
    }

    const origCol = columns[recvCol.id];

    if (!origCol) {
      // recvCol is a new column
      if (recvCol.id != null) {
        console.warn('new column should not have an ID');
      }
      recvCol.ctime = recvCol.mtime = tools.uniqueNow();
      recvCol.id = '/id/col/' + recvCol.ctime;
      recvCol.definedBy = email;
    } else {
      // recvCol is a column that already exists
      recvCol.ctime = origCol.ctime;
      recvCol.mtime = origCol.mtime;
      recvCol.definedBy = origCol.definedBy;
      if (recvCol.title !== origCol.title ||
          recvCol.type !== origCol.type ||
          recvCol.description !== origCol.description) {
        if (origCol.definedBy !== email) {
          throw new ValidationError(`only ${origCol.definedBy} can edit column ${recvCol.id}`);
        }
        recvCol.mtime = tools.uniqueNow();
      }
      // todo column comments - a non-owner can add/edit comments
    }

    tools.deleteCHECKvalues(recvCol);

    // save tha paper in the data store
    const key = datastore.key(['Column', recvCol.id]);
    // this is here until we add versioning on the papers themselves
    const logKey = datastore.key(['Column', recvCol.id,
                                  'ColumnLog', recvCol.id + '/' + recvCol.mtime]);
    console.log('saveColumn saving (into Column and ColumnLog)');
    return new Promise((resolve, reject) => {
      datastore.save(
        [
          { key, data: recvCol },
          { key: logKey,
            data:
            [
              { name: 'mtime',
                value: recvCol.mtime },
              { name: 'column',
                value: recvCol,
                excludeFromIndexes: true },
            ] },
        ],
        (err) => {
          if (err) {
            console.error('error saving column');
            console.error(err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    })
    .then(() => {
      columns[recvCol.id] = recvCol;
      return recvCol;
    });
  });
};
