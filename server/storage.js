/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const ValidationError = require('./errors/ValidationError');
const NotImplementedError = require('./errors/NotImplementedError');
const config = require('./config');
const tools = require('./tools');

const gcloud = require('google-cloud')(config.gcloudProject);

const datastore = gcloud.datastore({ namespace: config.gcloudDatastoreNamespace });

const TITLE_REXP = new RegExp(`^${config.TITLE_RE}$`);

/* shared
 *
 *
 *    ####  #    #   ##   #####  ###### #####
 *   #      #    #  #  #  #    # #      #    #
 *    ####  ###### #    # #    # #####  #    #
 *        # #    # ###### #####  #      #    #
 *   #    # #    # #    # #   #  #      #    #
 *    ####  #    # #    # #    # ###### #####
 *
 *
 */

// in papers, metaanalyses, and comments fill in enteredBy and ctime
function fillByAndCtimes(current, original, email) {
  const orig = original || {};
  if (!current.enteredBy) current.enteredBy = orig.enteredBy || email;
  if (!current.ctime) current.ctime = orig.ctime || tools.uniqueNow();
  fillByAndCtimeInComments(current.comments, orig.comments, email);
  if (current.experiments) {
    for (let expIndex = 0; expIndex < current.experiments.length; expIndex++) {
      const exp = current.experiments[expIndex];
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

function checkForDisallowedChanges(current, original, columns) {
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
  // todo check that columnOrder references existing columns; that paperOrder references existing papers
  // this might end up being different for papers and for metaanalyses

  original = original || {};

  // check that title hasn't changed or if it has, that it is unique
  if (current.title !== original.title) {
    if (!TITLE_REXP.test(current.title)) {
      throw new ValidationError('title cannot contain spaces or special characters');
    }
    if (allTitles.indexOf(current.title) !== -1) {
      throw new ValidationError('title must be unique');
    }
    if (current.title === config.NEW_PAPER_TITLE || current.title === config.NEW_META_TITLE) {
      throw new ValidationError('cannot use a reserved name');
    }
  }

  // check that every experiment has at least the data values that were there originally
  // check that only last comment by a given user has changed, if any
  if (current.experiments) {
    const expTitles = {};

    for (let expIndex = 0; expIndex < current.experiments.length; expIndex++) {
      const exp = current.experiments[expIndex];
      const origExp = (original.experiments || [])[expIndex] || {};

      // check experiment titles are there and unique for this current
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

const allTitles = [];

module.exports.listTitles = () =>
  metaanalysisCache.then(() => paperCache)
  .then(() => allTitles);

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
        // console.log('getAllUsers: got a user ' + entity.data.emails[0].value);
      } catch (err) {
        console.error('error in a user entity (ignoring)');
        console.error(err);
      }
    })
    .on('end', () => {
      console.log(`getAllUsers: ${Object.keys(retval).length} done`);
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
      allTitles.push(entity.data.title);
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
  if (time) return Promise.reject(new NotImplementedError('getPaperByTitle with time not implemented'));

  // todo different users can use different titles for the same thing
  if (title === config.NEW_PAPER_TITLE) return Promise.resolve(newPaper(email));
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

let currentPaperSave = Promise.resolve();

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

  currentPaperSave = tools.waitForPromise(currentPaperSave)
  .then(() => columnCache)
  .then((cols) => { columns = cols; })
  .then(() => paperCache)
  .then((papers) => {
    // prepare the paper for saving
    const ctime = tools.uniqueNow();
    let original = null;
    if (!paper.id) {
      paper.id = '/id/p/' + ctime;
      paper.enteredBy = email;
      paper.ctime = paper.mtime = ctime;
      doAddPaperToCache = () => {
        papers.push(paper);
        allTitles.push(paper.title);
      };
    } else {
      let i = 0;
      for (; i < papers.length; i++) {
        if (papers[i].id === paper.id) { // todo change paperCache to be indexed by id?
          original = papers[i];
          break;
        }
      }

      if (!original || origTitle !== original.title) {
        throw new ValidationError(
          `failed savePaper: did not find id ${paper.id} with title ${origTitle}`);
      }
      if (email !== original.enteredBy) {
        throw new NotImplementedError('not implemented saving someone else\'s paper');
      }

      paper.enteredBy = original.enteredBy;
      paper.ctime = original.ctime;
      paper.mtime = tools.uniqueNow();
      doAddPaperToCache = () => {
        // put the paper in the cache where the original paper was
        // todo this can be broken by deletion - the `i` would then change
        papers[i] = paper;
        // replace in allTitles the old title of the paper with the new title
        if (original.title !== paper.title) {
          let titleIndex = allTitles.indexOf(original.title);
          if (titleIndex === -1) {
            titleIndex = allTitles.length;
            console.warn(`for some reason, title ${original.title} was missing in allTitles`);
          }
          allTitles[titleIndex] = paper.title;
        }
      };
    }

    // validate incoming data
    checkForDisallowedChanges(paper, original, columns);

    // put ctime and enteredBy on every experiment, datum, and comment that doesn't have them
    fillByAndCtimes(paper, original, email);

    // for now, we choose to ignore if the incoming paper specifies the wrong immutable values here
    // do not save any of the validation values
    tools.deleteCHECKvalues(paper);

    // save the paper in the data store
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

  return currentPaperSave;
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
  published: "Aug 2010, J. Smith, J. Doe, ...",
  description: "brief description lorem ipsum",
  tags: [
    "memory",
    "misinformation",
  ],
  // todo various extra things
  // todo versioning of the metaanalysis data can be like for papers
}
 */

let metaanalysisCache;

// get all immediately on the start of the server
getAllMetaanalyses();

function getAllMetaanalyses() {
  metaanalysisCache = new Promise((resolve, reject) => {
    console.log('getAllMetaanalyses: making a datastore request');
    const retval = [];
    datastore.createQuery('Metaanalysis').run()
    .on('error', (err) => {
      console.error('error retrieving metaanalyses');
      console.error(err);
      setTimeout(getAllMetaanalyses, 60 * 1000); // try loading again in a minute
      reject(err);
    })
    .on('data', (entity) => {
      retval.push(migrateMetaanalysis(entity.data));
      allTitles.push(entity.data.title);
    })
    .on('end', () => {
      console.log(`getAllMetaanalyses: ${retval.length} done`);
      resolve(retval);
    });
  });
}

/*
 * change metaanalysis from an old format to the new one, if need be
 */
function migrateMetaanalysis(metaanalysis) {
  // do nothing for now
  return metaanalysis;
}

module.exports.getMetaanalysesEnteredBy = (email) => {
  // todo also return metaanalyses contributed to by `email`
  return metaanalysisCache.then(
    (metaanalyses) => metaanalyses.filter((ma) => ma.enteredBy === email)
  );
};

module.exports.getMetaanalysisByTitle = (email, title, time) => {
  // todo if time is specified, compute a version as of that time
  if (time) return Promise.reject(new NotImplementedError('getMetaanalysisByTitle with time not implemented'));

  // todo different users can use different titles for the same thing
  if (title === config.NEW_META_TITLE) return Promise.resolve(newMetaanalysis(email));
  return metaanalysisCache
  .then((metaanalyses) => {
    for (const ma of metaanalyses) {
      if (ma.title === title) {
        return ma;
      }
    }
    return Promise.reject();
  });
};

module.exports.getMetaanalysisPapersByTitle = (email, maTitle, time) => {
  return module.exports.getMetaanalysisByTitle(email, maTitle, time)
  .then((metaanalysis) =>
    paperCache.then(
      (papers) => papers.filter((p) => metaanalysis.paperOrder.indexOf(p.id) !== -1)
    )
  );
};

function newMetaanalysis(email) {
  const time = tools.uniqueNow();
  return {
    enteredBy: email,
    ctime: time,
    mtime: time,
  };
}

module.exports.listMetaanalyses = () => metaanalysisCache;

let currentMetaanalysisSave = Promise.resolve();

module.exports.saveMetaanalysis = (metaanalysis, email, origTitle) => {
  // todo multiple users' views on one metaanalysis
  // compute this user's version of this metaanalysis, as it is in the database
  // compute a diff between what's submitted and the user's version of this metaanalysis
  // detect any update conflicts (how?)
  // add the diff to the metaanalysis as a changeset
  // update the metaanalysis data only if the user is the one who it's enteredBy
  // only allow editing a comment if it's the last one by this user
  //   (must allow editing the last comment by this user in case in the meantime another user
  //    has added another comment)

  let doAddMetaanalysisToCache;

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create metaanalyses with the same title

  currentMetaanalysisSave = tools.waitForPromise(currentMetaanalysisSave)
  .then(() => metaanalysisCache)
  .then((metaanalyses) => {
    // prepare the metaanalysis for saving
    const ctime = tools.uniqueNow();
    let original = null;
    if (!metaanalysis.id) {
      metaanalysis.id = '/id/ma/' + ctime;
      metaanalysis.enteredBy = email;
      metaanalysis.ctime = metaanalysis.mtime = ctime;
      doAddMetaanalysisToCache = () => {
        metaanalyses.push(metaanalysis);
        allTitles.push(metaanalysis.title);
      };
    } else {
      let i = 0;
      for (; i < metaanalyses.length; i++) {
        if (metaanalyses[i].id === metaanalysis.id) { // todo change metaanalysisCache to be indexed by id?
          original = metaanalyses[i];
          break;
        }
      }

      if (!original || origTitle !== original.title) {
        throw new ValidationError(
          `failed saveMetaanalysis: did not find id ${metaanalysis.id} with title ${origTitle}`);
      }
      if (email !== original.enteredBy) {
        throw new NotImplementedError('not implemented saving someone else\'s metaanalysis');
      }

      metaanalysis.enteredBy = original.enteredBy;
      metaanalysis.ctime = original.ctime;
      metaanalysis.mtime = tools.uniqueNow();
      doAddMetaanalysisToCache = () => {
        // put the metaanalysis in the cache where the original metaanalysis was
        // todo this can be broken by deletion - the `i` would then change
        metaanalyses[i] = metaanalysis;
        // replace in allTitles the old title of the metaanalysis with the new title
        if (original.title !== metaanalysis.title) {
          let titleIndex = allTitles.indexOf(original.title);
          if (titleIndex === -1) {
            titleIndex = allTitles.length;
            console.warn(`for some reason, title ${original.title} was missing in allTitles`);
          }
          allTitles[titleIndex] = metaanalysis.title;
        }
      };
    }

    // validate incoming data
    checkForDisallowedChanges(metaanalysis, original);

    // put ctime and enteredBy on every experiment, datum, and comment that doesn't have them
    fillByAndCtimes(metaanalysis, original, email);

    // for now, we choose to ignore if the incoming metaanalysis specifies
    // the wrong immutable values here do not save any of the validation values
    tools.deleteCHECKvalues(metaanalysis);

    // save the metaanalysis in the data store
    const key = datastore.key(['Metaanalysis', metaanalysis.id]);
    // this is here until we add versioning on the metaanalyses themselves
    const logKey = datastore.key(['Metaanalysis', metaanalysis.id,
                                  'MetaanalysisLog', metaanalysis.id + '/' + metaanalysis.mtime]);
    console.log('saveMetaanalysis saving (into Metaanalysis and MetaanalysisLog)');
    return new Promise((resolve, reject) => {
      datastore.save(
        [
          { key, data: metaanalysis },
          { key: logKey,
            data:
            [
              { name: 'mtime',
                value: metaanalysis.mtime },
              { name: 'enteredBy',
                value: email },
              { name: 'metaanalysis',
                value: metaanalysis,
                excludeFromIndexes: true },
            ] },
        ],
        (err) => {
          if (err) {
            console.error('error saving metaanalysis');
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
    doAddMetaanalysisToCache();
    return metaanalysis;
  });

  return currentMetaanalysisSave;
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
        // console.log('getAllColumns: got a column ' + entity.data.id);
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
          recvCol.description !== origCol.description ||
          recvCol.formula !== origCol.formula ||
          JSON.stringify(recvCol.formulaColumns) !== JSON.stringify(origCol.formulaColumns)) {
        if (origCol.definedBy !== email) {
          throw new ValidationError(`only ${origCol.definedBy} can edit column ${recvCol.id}`);
        }
        recvCol.mtime = tools.uniqueNow();
      }
      // todo column comments - a non-owner can add/edit comments
    }

    tools.deleteCHECKvalues(recvCol);

    // save the column in the data store
    const key = datastore.key(['Column', recvCol.id]);
    // this is here until we add versioning on the columns themselves
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


module.exports.ready =
  metaanalysisCache
  .then(() => paperCache)
  .then(() => userCache)
  .then(() => columnCache)
  .then(() => console.log('storage: all is now loaded'));
