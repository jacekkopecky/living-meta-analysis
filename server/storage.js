/*
 * This is a simple wrapper for storage, initially a google datastore.
 *
 * WARNING: this wrapper expects to be the sole user of the datastore -
 * it never validates its cached values!
 */

'use strict';

const { Datastore } = require('@google-cloud/datastore');
const fs = require('fs');
const path = require('path');
const ValidationError = require('./errors/ValidationError');
const NotImplementedError = require('./errors/NotImplementedError');
const ForbiddenError = require('./errors/ForbiddenError');
const config = require('./config');
const tools = require('./lib/tools');


const datastore = process.env.TESTING ? createStubDatastore()
  : new Datastore({
    projectId: config.gcloudProject.projectId,
    keyFilename: config.gcloudProject.keyFilename,
    namespace: config.gcloudDatastoreNamespace,
  });

const TITLE_REXP = new RegExp(`^${config.TITLE_RE}$`);
const USERNAME_REXP = new RegExp(`^${config.USERNAME_RE}$`);

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

  if (current.columns) {
    for (let colIndex = 0; colIndex < current.columns.length; colIndex++) {
      if (typeof current.columns[colIndex] === 'object') {
        const col = current.columns[colIndex];
        const origCol = (orig.columns || [])[colIndex] || {};
        fillByAndCtimeInComments(col.comments, origCol.comments, email);
      }
    }
  }

  if (current.aggregates) {
    for (let aggrIndex = 0; aggrIndex < current.aggregates.length; aggrIndex++) {
      const aggr = current.aggregates[aggrIndex];
      const origAggr = (orig.aggregates || [])[aggrIndex] || {};
      fillByAndCtimeInComments(aggr.comments, origAggr.comments, email);
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

function checkForDisallowedChanges(current, original) {
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
  // todo check that columns and groupingColumn and aggregates references existing columns
  // todo check that paperOrder references existing papers
  // this might end up being different for papers and for metaanalyses
  // todo refuse to save if all the experiments of a paper are hidden in the metaanalysis
  //    - the paper should be gone from this metaanalysis

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

  // check that username hasn't changed or if it has, that it is empty or unique
  if (current.username != null && current.username !== original.username) {
    if (!USERNAME_REXP.test(current.username)) {
      throw new ValidationError('username cannot contain spaces or special characters');
    }
    if (allUsernames.indexOf(current.username.toLowerCase()) !== -1) {
      throw new ValidationError('username must be unique, must not be from the forbidden list');
    }
    // todo: do we need extra checks here? I.e. length of username? encodings? emojis?
  }

  // check that no two columns have the same ID
  // check that computed columns don't have IDs and that the others do
  // also prepare a hash of known column IDs for use later
  const knownColumnIDs = {};
  if (current.columns) {
    current.columns.forEach((colObject) => {
      if (colObject.formula && colObject.id) throw new ValidationError('computed column must not have ID');
      if (!colObject.formula && !colObject.id) throw new ValidationError('column without ID must have formula');

      if (colObject.id) {
        if (knownColumnIDs[colObject.id]) {
          throw new ValidationError('two columns cannot have the same ID');
        }
        knownColumnIDs[colObject.id] = true;
      }
    });
  }


  // check that every experiment has at least the data values that were there originally
  // check that only last comment by a given user has changed, if any
  if (current.experiments) {
    for (let expIndex = 0; expIndex < current.experiments.length; expIndex++) {
      const exp = current.experiments[expIndex];
      const origExp = (original.experiments || [])[expIndex] || {};

      // check experiment titles are there (but need not be unique)
      if (!TITLE_REXP.test(exp.title)) {
        throw new ValidationError('experiment title cannot contain spaces or special characters');
      }

      if (origExp.data) {
        if (!exp.data) throw new ValidationError('cannot remove experiment data array');

        for (const origDataKey of Object.keys(origExp.data)) {
          if (!(origDataKey in exp.data)) {
            throw new ValidationError('cannot remove experiment data');
          }

          const { comments } = exp.data[origDataKey];
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
          if (!knownColumnIDs[dataKey]) {
            throw new ValidationError('cannot include data with unknown column ID ' + dataKey);
          }
        }
      }
    }
  }
}

const allTitles = [];

module.exports.listTitles = async () => {
  await metaanalysisCache;
  await paperCache;
  return allTitles;
};


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
 *   "ctime": 1467367646989,
 *   "mtime": 1467367646989, // the user last 'registered' i.e. agreed to t&c's (may have changed username)
 *   "email": "example@example.com",
 *   "displayName": "Example Exampleson",
 *   "username": "ExampleUsername1234", // see regex for exact allowed names
 *   "photos": [
 *     {
 *       "value": "https://lh5.googleusercontent.com/EXAMPLE/photo.jpg"
 *     }
 *   ]
 *   // todo favorites: [ "/id/p/4903", "/id/m/649803", ]
 * }
 * API handles mtime, email, username.
 * API forwards displayName, photos from Google
 * Storage handles ctime & username regex checks
 */

const LOCAL_STORAGE_SPECIAL_USER = 'lima@local';
const LOCAL_STORAGE_SPECIAL_USERNAME = 'local';

let userCache = tools.notInitialized();

async function getAllUsers() {
  console.log('getAllUsers: making a datastore request');
  try {
    const [retval] = await datastore.createQuery('User').run();
    retval.forEach(user => {
      // SUGGESTION: is this needed anymore?
      user = migrateUser(user);
      if (user.username) {
        allUsernames.push(user.username.toLowerCase());
      }
      try {
        retval[user.email] = user;
      } catch (err) {
        console.error('error in a user entity (ignoring)');
        console.error(err);
      }
    });
    console.log(`getAllUsers: ${retval.length} done`);
    // add a special user for local storage
    // - after all other users are loaded so datastore never overrides this one
    // - we expect our auth providers never go issue this email address so no user can use it
    retval[LOCAL_STORAGE_SPECIAL_USER] = {
      email: LOCAL_STORAGE_SPECIAL_USER,
      username: LOCAL_STORAGE_SPECIAL_USERNAME,
    };
    // TODO: rework cache
    userCache = retval;
    return retval;
  } catch (error) {
    console.error('error retrieving users', error);
    setTimeout(getAllUsers, 60 * 1000); // try loading again in a minute
    throw error;
  }
}

/*
 * change user from an old format to the new one on load from datastore, if need be
 */
function migrateUser(user) {
  // 2017-06-08: Only store limited user information
  //     when all is migrated: just remove this code
  if (user.emails) {
    user.email = user.emails[0].value;
    delete user.emails;
    delete user.CHECKid;
    delete user.id;
    delete user.name;
    delete user.provider;
    user.migrated = true;
  }
  return user;
}

module.exports.migrateUser = migrateUser;

function getUser(user) {
  if (!user) {
    throw new Error('user parameter required');
  }

  if (forbiddenUsernames.indexOf(user) !== -1) {
    return Promise.reject(new ForbiddenError('provided username is a reserved word'));
  }

  return Promise.all([getEmailAddressOfUser(user), userCache])
    .then(
      (vals) => {
        const email = vals[0];
        const users = vals[1];
        return users[email] || Promise.reject(`user ${email} not found`);
      },
    );
}

module.exports.getUser = getUser;

module.exports.listUsers = () => {
  return userCache;
};

module.exports.saveUser = (email, user, options) => {
  options = options || {};
  // todo do we want to keep a Log of users?
  if (!email || !user) {
    throw new Error('email/user parameters required');
  }

  if (email === LOCAL_STORAGE_SPECIAL_USER) {
    return Promise.reject(new Error('must not add the user ' + LOCAL_STORAGE_SPECIAL_USER));
  }

  if (!user.ctime) { // new user
    user.ctime = tools.uniqueNow();
  }

  return userCache.then(
    (users) => new Promise((resolve, reject) => {
      const original = users[email];
      // reject the save if we're restoring from another datastore and we already have this user
      if (options.restoring && original) {
        reject(new Error(`user ${user.email} already exists`));
        return;
      }
      checkForDisallowedChanges(user, original);
      const key = datastore.key(['User', email]);
      console.log('saveUser making a datastore request');
      datastore.save({
        key,
        data: user,
      }, (err) => {
        if (err) {
          console.error('error saving user');
          console.error(err);
          reject(err);
        } else {
          // update the local cache of users
          users[email] = user;
          if (original && original.username) {
            const index = allUsernames.indexOf(original.username.toLowerCase());
            if (index !== -1) {
              allUsernames.splice(index, 1);
            }
          }
          if (user.username) allUsernames.push(user.username.toLowerCase());

          // return the user
          resolve(user);
        }
      });
    }),
  );
};

// on start of web server put all file names in /webpages into this list, with and without filename extensions
const forbiddenUsernames = [];

function getForbiddenUsernames() {
  // start initially with those defined in config
  const retval = [].concat(config.FORBIDDEN_USERNAMES);

  // then populate the rest by taking a look at /webpages
  const files = fs.readdirSync(path.join(__dirname, '../webpages'));

  files.forEach((name) => {
    addUsernameIfNotThere(retval, name);
    addUsernameIfNotThere(retval, name.replace(/\..*$/, ''));
  });

  function addUsernameIfNotThere(arr, name) {
    // don't add usernames that wouldn't be allowed anyway
    if (!name) return;
    if (!name.match(USERNAME_REXP)) return;

    if (arr.indexOf(name) === -1) arr.push(name.toLowerCase());
  }

  // push all the found forbidden usernames into the global array
  Array.prototype.push.apply(forbiddenUsernames, retval);
  Array.prototype.push.apply(allUsernames, forbiddenUsernames);
}

// all the forbidden usernames will be treated as taken
const allUsernames = [LOCAL_STORAGE_SPECIAL_USERNAME];

// Take either the email address, or username and return the email address
function getEmailAddressOfUser(user) {
  if (user.indexOf('@') !== -1) return Promise.resolve(user);

  return userCache.then((users) => {
    for (const email of Object.keys(users)) {
      if (users[email].username === user) {
        return email;
      }
    }
    return null;
  });
}

module.exports.getEmailAddressOfUser = getEmailAddressOfUser;

// Take either the email address, or username and return the username (or null if there is none)
function getUsernameOfUser(user) {
  if (user.indexOf('@') === -1) return Promise.resolve(user);

  return userCache.then((users) => users[user].username);
}

module.exports.getUsernameOfUser = getUsernameOfUser;


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
  columns: [ '/id/col/12', '/id/col/13', '/id/col/14' ],
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

let paperCache = tools.notInitialized();

async function getAllPapers() {
  const columns = await columnCache;
  try {
    const [retval] = await datastore.createQuery('Paper').run();
    retval.forEach(val => {
      val = migratePaper(val, columns);
      allTitles.push(val.title);
    });
    console.log(`getAllPapers: ${retval.length} done`);
    paperCache = retval;
    return retval;
  } catch (error) {
    console.error('error retrieving papers', error);
    setTimeout(getAllPapers, 60 * 1000); // try loading again in a minute
    throw error;
  }
}

/*
 * change paper from an old format to the new one on load from datastore, if need be
 */
function migratePaper(paper, columns) {
  // 2017-02-23: move columnOrder to columns
  //     when all is migrated: just remove this code
  if (paper.columnOrder) {
    paper.columns = paper.columnOrder;
    delete paper.columnOrder;
    paper.migrated = true;
  }

  // 2017-06-27: migrate global columns to private columns
  //     when all is migrated:
  //       remove this code,
  //       remove obsoleteIDForMigration from api.js
  //       update tests to check migration no longer does this
  //       remove all remaining mentions of global columns
  //       remove columns from datastore

  // if we have a datum whose column ID isn't in paper.columns then add it there
  if (!paper.columns) paper.columns = [];
  if (paper.experiments) {
    paper.experiments.forEach((exp) => {
      if (exp.data) {
        Object.keys(exp.data).forEach((colId) => {
          if (colId.startsWith('/id/col/') && paper.columns.indexOf(colId) === -1) {
            paper.columns.push(colId);
            paper.migrated = true;
          }
        });
      }
    });
  }

  let maxId = 0;
  paper.columns.forEach((col, colIndex) => {
    if (typeof col === 'string') {
      // migrate the string into an object
      if (!columns[col]) throw new Error(`paper ${paper.title} uses nonexistent column ${col}`);
      const colObject = {
        id: '' + (maxId += 1),
        title: columns[col].title,
        description: columns[col].description,
        type: columns[col].type,
        obsoleteIDForMigration: col,
      };
      paper.columns[colIndex] = colObject;
      // migrate experiment data so it uses the column ID
      if (paper.experiments) {
        paper.experiments.forEach((exp) => {
          if (exp.data && col in exp.data) {
            exp.data[colObject.id] = exp.data[col];
            delete exp.data[col];
          }
        });
      }
      // migrate hidden columns so it uses the right column ID
      if (paper.hiddenCols) {
        const colPos = paper.hiddenCols.indexOf(col);
        if (colPos !== -1) {
          paper.hiddenCols[colPos] = colObject.id;
        }
      }
      // migrate every parameter in computed anything into the right ID
      paper.columns.forEach((computed) => {
        if (!computed.formula) return; // not computed
        // replace all occurrences of col in the formula with colObject.id
        computed.formula = computed.formula.split(col).join(colObject.id);
      });
      paper.migrated = true;
    }
  });
  // check that every computed column's formula doesn't contain '/id/col/',
  // remove offending ones because they don't have data in the paper anyway so no loss
  // also migrate customName to title and add type: result
  let computedIndex = paper.columns.length - 1;
  while (computedIndex >= 0) {
    const computed = paper.columns[computedIndex];
    if (computed.formula) {
      if (computed.formula.indexOf('/id/col/') !== -1) {
        paper.columns.splice(computedIndex, 1);
        paper.migrated = true;
      }
      if (computed.customName || !computed.type) {
        computed.title = computed.customName;
        delete computed.customName;
        computed.type = 'result';
        paper.migrated = true;
      }
    }
    computedIndex -= 1;
  }
  // if we have a hiddenColumn that's not migrated, drop it
  if (paper.hiddenCols) {
    let hiddenIndex = paper.hiddenCols.length - 1;
    while (hiddenIndex >= 0) {
      if (paper.hiddenCols[hiddenIndex].startsWith('/id/col/')) {
        paper.hiddenCols.splice(hiddenIndex, 1);
        paper.migrated = true;
      }
      hiddenIndex -= 1;
    }
  }

  return paper;
}

module.exports.migratePaper = migratePaper;


module.exports.getPapersEnteredBy = (user) => {
  if (!user) {
    throw new Error('user parameter required');
  }
  return Promise.all([getEmailAddressOfUser(user), paperCache])
    .then(
      (vals) => {
        const email = vals[0];
        const papers = vals[1];
        return papers.filter((p) => p.enteredBy === email);
      },
    );
};

module.exports.getPaperByTitle = (user, title, time) => {
  // todo if time is specified, compute a version as of that time
  if (time) return Promise.reject(new NotImplementedError('getPaperByTitle with time not implemented'));

  if (!user || !title) {
    throw new Error('user and title parameters required');
  }

  // todo different users can use different titles for the same thing

  if (title === config.NEW_PAPER_TITLE) {
    return getEmailAddressOfUser(user).then((email) => newPaper(email));
  }

  return getUser(user) // check that the user exists (we ignore the return value)
    .then(() => paperCache)
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

module.exports.savePaper = (paper, email, origTitle, options) => {
  options = options || {};
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

  currentPaperSave = tools.waitForPromise(currentPaperSave)
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

        if (options.restoring) {
        // paper is a paper we're restoring from some other datastore
        // reject the save if we already have it
          if (original) return Promise.reject(new Error(`paper ${paper.id} already exists`));
        // otherwise save unchanged
        } else {
        // paper overwrites an existing paper
          if (!original || origTitle !== original.title) {
            throw new ValidationError(
              `failed savePaper: did not find id ${paper.id} with title ${origTitle}`,
            );
          }
          if (email !== original.enteredBy) {
            throw new NotImplementedError('not implemented saving someone else\'s paper');
          }

          paper.enteredBy = original.enteredBy;
          paper.ctime = original.ctime;
          paper.mtime = tools.uniqueNow();
        }

        doAddPaperToCache = () => {
        // put the paper in the cache where the original paper was
        // todo this can be broken by deletion - the `i` would then change
          papers[i] = paper;
          // replace in allTitles the old title of the paper with the new title
          if (original && original.title !== paper.title) {
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
      checkForDisallowedChanges(paper, original);

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
      if (!options.restoring) console.log('savePaper saving (into Paper and PaperLog)');
      return new Promise((resolve, reject) => {
        datastore.save(
          [
            { key, data: paper },
            {
              key: logKey,
              data:
            [
              {
                name: 'mtime',
                value: paper.mtime,
              },
              {
                name: 'enteredBy',
                value: email,
              },
              {
                name: 'paper',
                value: paper,
                excludeFromIndexes: true,
              },
            ],
            },
          ],
          (err) => {
            if (err) {
              console.error('error saving paper');
              console.error(err);
              reject(err);
            } else {
              resolve();
            }
          },
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

let metaanalysisCache = tools.notInitialized();

async function getAllMetaanalyses() {
  const columns = columnCache;
  const papers = paperCache;

  if (!columns) throw new Error('No columns in cache');
  if (!papers) throw new Error('No papers in cache');

  try {
    console.log('getAllMetaanalyses: making a datastore request');
    const [retval] = await datastore.createQuery('Metaanalysis').run();
    retval.forEach(val => {
      migrateMetaanalysis(val, papers, columns);
      allTitles.push(val.title);
    });
    console.log(`getAllMetaanalyses: ${retval.length} done`);
    metaanalysisCache = retval;
    return retval;
  } catch (error) {
    console.error('error retrieving metaanalyses', error);
    setTimeout(getAllMetaanalyses, 60 * 1000); // try loading again in a minute
    throw error;
  }
}

/*
 * change metaanalysis from an old format to the new one on load from datastore, if need be
 */
function migrateMetaanalysis(metaanalysis, papers, columns) {
  // 2017-02-23: move columnOrder to columns
  //     when all is migrated: just remove this code
  if (metaanalysis.columnOrder) {
    metaanalysis.columns = metaanalysis.columnOrder;
    delete metaanalysis.columnOrder;
    metaanalysis.migrated = true;
  }

  // 2017-05-02: move graph aggregates to graphs
  //     when all is migrated: just remove this code
  // migrate aggregate graphs to graphs
  if (metaanalysis.aggregates) {
    const oldGraphs = ['forestPlotNumberAggr', 'forestPlotPercentAggr',
      'grapeChartNumberAggr', 'grapeChartPercentAggr'];
    // going backwards so we can safely delete array elements
    for (let i = metaanalysis.aggregates.length - 1; i >= 0; i -= 1) {
      const formulaName = metaanalysis.aggregates[i].formula.split('(')[0];
      if (oldGraphs.indexOf(formulaName) !== -1) {
        const graph = metaanalysis.aggregates[i];
        metaanalysis.aggregates.splice(i, 1);
        graph.formula = graph.formula.replace('Aggr', 'Graph');
        if (!metaanalysis.graphs) {
          metaanalysis.graphs = [];
        }
        metaanalysis.graphs.unshift(graph);
        metaanalysis.migrated = true;
      }
    }
  }

  // 2017-06-28: migrate global columns to private columns
  //     when all is migrated:
  //       remove this code,
  //       update tests to check migration no longer does this
  //       remove all remaining mentions of global columns
  //       remove columns from datastore
  // prepare the papers this metaanalysis depends on
  const maPapers = metaanalysis.paperOrder.map((paperId) => {
    // find the paper with the matching ID
    const retval = papers.find((paper) => paper.id === paperId);
    if (!retval) {
      throw new Error(`metaanalysis ${metaanalysis.title} has a paper ${paperId} that isn't in the datastore`);
    }
    return retval;
  });

  // convert columns from string to object
  if (!metaanalysis.columns) metaanalysis.columns = [];
  let maxId = 0;
  metaanalysis.columns.forEach((col, colIndex) => {
    if (typeof col === 'string') {
      // migrate the string into an object
      if (!columns[col]) throw new Error(`metaanalysis ${metaanalysis.title} uses nonexistent column ${col}`);
      const colObject = {
        id: '' + (maxId += 1),
        title: columns[col].title,
        description: columns[col].description,
        type: columns[col].type,
      };
      // add sourceColumnMap { paperId: columnId }
      colObject.sourceColumnMap = {};
      maPapers.forEach((paper) => {
        // go through paper's columns, find the one whose obsolete id matches col, use its ID in this map
        const paperCol = paper.columns.find((paperColObject) => paperColObject.obsoleteIDForMigration === col);
        if (paperCol) colObject.sourceColumnMap[paper.id] = paperCol.id;
        // if the paper doesn't have such a column, just don't have a mapping;
        // the column in the paper, and the mapping here, will get added when
        // the metaanalysis is being edited and the user puts in a datum in this column
      });
      metaanalysis.columns[colIndex] = colObject;
      // migrate hidden columns so it uses the right column ID
      if (metaanalysis.hiddenCols) {
        const colPos = metaanalysis.hiddenCols.indexOf(col);
        if (colPos !== -1) {
          metaanalysis.hiddenCols[colPos] = colObject.id;
        }
      }
      // convert grouping column to new ID
      if (metaanalysis.groupingColumn === col) metaanalysis.groupingColumn = colObject.id;
      // migrate every parameter in computed anything into the right ID
      for (const fieldName of ['columns', 'aggregates', 'groupingAggregates', 'graphs']) {
        if (metaanalysis[fieldName]) {
          metaanalysis[fieldName].forEach((computed) => {
            if (!computed.formula) return; // not computed
            // replace all occurrences of col in the formula with colObject.id
            computed.formula = computed.formula.split(col).join(colObject.id);
          });
        }
      }
      metaanalysis.migrated = true;
    }
  });
  // check that every computed thing's formula doesn't contain '/id/col/',
  // remove offending ones because they don't have data in the metaanalysis anyway so no loss
  // also migrate customName to title and add type: result
  for (const fieldName of ['columns', 'aggregates', 'groupingAggregates', 'graphs']) {
    if (metaanalysis[fieldName]) {
      let computedIndex = metaanalysis[fieldName].length - 1;
      while (computedIndex >= 0) {
        const computed = metaanalysis[fieldName][computedIndex];
        if (computed.formula) {
          if (computed.formula.indexOf('/id/col/') !== -1) {
            metaanalysis[fieldName].splice(computedIndex, 1);
            metaanalysis.migrated = true;
          }
          if (computed.customName) {
            computed.title = computed.customName;
            delete computed.customName;
            metaanalysis.migrated = true;
          }
          if (!computed.type && fieldName === 'columns') {
            computed.type = 'result';
            metaanalysis.migrated = true;
          }
        }
        computedIndex -= 1;
      }
    }
  }
  // if we have a hiddenColumn that's not migrated, drop it
  if (metaanalysis.hiddenCols) {
    let hiddenIndex = metaanalysis.hiddenCols.length - 1;
    while (hiddenIndex >= 0) {
      if (metaanalysis.hiddenCols[hiddenIndex].startsWith('/id/col/')) {
        metaanalysis.hiddenCols.splice(hiddenIndex, 1);
        metaanalysis.migrated = true;
      }
      hiddenIndex -= 1;
    }
  }

  return metaanalysis;
}

module.exports.migrateMetaanalysis = migrateMetaanalysis;

module.exports.getMetaanalysesEnteredBy = (user) => {
  // todo also return metaanalyses contributed to by `email`
  if (!user) {
    throw new Error('user parameter required');
  }
  return Promise.all([getEmailAddressOfUser(user), metaanalysisCache])
    .then(
      (vals) => {
        const email = vals[0];
        const metaanalyses = vals[1];
        return metaanalyses.filter((ma) => ma.enteredBy === email);
      },
    );
};

module.exports.getMetaanalysisByTitle = (user, title, time, includePapers) => {
  // todo if time is specified, compute a version as of that time
  if (time) {
    return Promise.reject(new NotImplementedError('getMetaanalysisByTitle with time not implemented'));
  }

  // todo different users can use different titles for the same thing

  if (title === config.NEW_META_TITLE) {
    return getEmailAddressOfUser(user).then((email) => newMetaanalysis(email));
  }

  return metaanalysisCache
    .then((metaanalyses) => {
      for (let ma of metaanalyses) {
        if (ma.title === title) {
          if (includePapers) {
          // use a shallow copy of ma
            ma = getMetaanalysisWithPapers(ma, time);
          }
          return ma;
        }
      }
      return Promise.reject();
    });
};

function getMetaanalysisWithPapers(ma, time) {
  if (time) {
    return Promise.reject(new NotImplementedError('getMetaanalysisWithPapers with time not implemented'));
  }

  return paperCache.then((papers) => {
    // use a shallow copy of ma
    ma = { ...ma };

    ma.papers = [];
    // populate the papers array in the order of ma.paperOrder
    papers.forEach((p) => {
      const index = ma.paperOrder.indexOf(p.id);
      if (index !== -1) ma.papers[index] = p;
    });

    return ma;
  });
}

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

module.exports.saveMetaanalysis = (metaanalysis, email, origTitle, options) => {
  options = options || {};
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

        if (options.restoring) {
        // metaanalysis is a metaanalysis we're restoring from some other datastore
        // reject the save if we already have it
          if (original) return Promise.reject(new Error(`metaanalysis ${metaanalysis.id} already exists`));
        // otherwise save unchanged
        } else {
        // metaanalysis overwrites an existing metaanalysis
          if (!original || origTitle !== original.title) {
            throw new ValidationError(
              `failed saveMetaanalysis: did not find id ${metaanalysis.id} with title ${origTitle}`,
            );
          }
          if (email !== original.enteredBy) {
            throw new NotImplementedError('not implemented saving someone else\'s metaanalysis');
          }

          metaanalysis.enteredBy = original.enteredBy;
          metaanalysis.ctime = original.ctime;
          metaanalysis.mtime = tools.uniqueNow();
        }

        doAddMetaanalysisToCache = () => {
        // put the metaanalysis in the cache where the original metaanalysis was
        // todo this can be broken by deletion - the `i` would then change
          metaanalyses[i] = metaanalysis;
          // replace in allTitles the old title of the metaanalysis with the new title
          if (original && original.title !== metaanalysis.title) {
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
      if (!options.restoring) console.log('saveMetaanalysis saving (into Metaanalysis and MetaanalysisLog)');
      return new Promise((resolve, reject) => {
        datastore.save(
          [
            { key, data: metaanalysis },
            {
              key: logKey,
              data:
            [
              {
                name: 'mtime',
                value: metaanalysis.mtime,
              },
              {
                name: 'enteredBy',
                value: email,
              },
              {
                name: 'metaanalysis',
                value: metaanalysis,
                excludeFromIndexes: true,
              },
            ],
            },
          ],
          (err) => {
            if (err) {
              console.error('error saving metaanalysis');
              console.error(err);
              reject(err);
            } else {
              resolve();
            }
          },
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

// columns can go away when we no longer need them for migrating

let columnCache = tools.notInitialized();

async function getAllColumns() {
  try {
    console.log('getAllColumns: making a datastore request');
    const retval = {};
    const [results] = await datastore.createQuery('Column').run();

    results.forEach(result => {
      try {
        retval[result.id] = result;
      } catch (error) {
        console.error('error in a column entity (ignoring)', error);
      }
    });

    console.log(`getAllColumns: ${Object.keys(retval).length} done`);
    columnCache = retval;
    return retval;
  } catch (error) {
    console.error('error retrieving columns', error);
    setTimeout(getAllColumns, 60 * 1000); // try loading again in a minute
    throw error;
  }
}


/* closed beta
 *
 *
 *    ####  #       ####   ####  ###### #####     #####  ###### #####   ##
 *   #    # #      #    # #      #      #    #    #    # #        #    #  #
 *   #      #      #    #  ####  #####  #    #    #####  #####    #   #    #
 *   #      #      #    #      # #      #    #    #    # #        #   ######
 *   #    # #      #    # #    # #      #    #    #    # #        #   #    #
 *    ####  ######  ####   ####  ###### #####     #####  ######   #   #    #
 *
 *
 */

function setupClosedBeta() {
  // a hash keyed on invite codes for closed beta users
  module.exports.betaCodes = {};

  // load the invitation codes from a file for now
  // every line has an invite code and after # possibly a comment
  // to generate an invite, there are instructions in the README
  // todo load the codes from the data store and have a management interface, update the README
  (function () {
    let invites;
    try {
      invites = fs.readFileSync('./invites.txt', 'utf8');
    } catch (e) {
      // let it crash
      throw new Error('BETA: need the file ./invites.txt to allow anybody in the server');
    }
    const lines = invites.split(/\n/);
    lines.forEach((line) => {
      const code = line.split('#')[0].trim();
      if (code) module.exports.betaCodes[code] = {};
    });
    if (Object.keys(module.exports.betaCodes).length === 0) {
      throw new Error('BETA: need invite codes in ./invites.txt to allow anybody in the server');
    }
    console.log(`BETA: got ${Object.keys(module.exports.betaCodes).length} invites`);
  }());

  // when we touch a beta code (someone uses it in a request), store:
  //   last access (trigger a save if more than 24h after the last one)
  //   logged-in email address if available (triggers a save if a new address there)
  //   access count per email address per day for the last 7 days
  module.exports.touchBetaCode = (code, email) => void email;
}


/* testing datastore
 *
 *
 *   ##### ######  ####  ##### # #    #  ####     #####    ##   #####   ##    ####  #####  ####  #####  ######
 *     #   #      #        #   # ##   # #    #    #    #  #  #    #    #  #  #        #   #    # #    # #
 *     #   #####   ####    #   # # #  # #         #    # #    #   #   #    #  ####    #   #    # #    # #####
 *     #   #           #   #   # #  # # #  ###    #    # ######   #   ######      #   #   #    # #####  #
 *     #   #      #    #   #   # #   ## #    #    #    # #    #   #   #    # #    #   #   #    # #   #  #
 *     #   ######  ####    #   # #    #  ####     #####  #    #   #   #    #  ####    #    ####  #    # ######
 *
 *
 */

function createStubDatastore() {
  const retval = {};
  function empty() { return retval; }
  function asyncCall(x, cb) { setImmediate(cb); return retval; }
  function asyncCallIfEnd(x, cb) { if (x === 'end') setImmediate(cb); return retval; }
  retval.key = empty;
  retval.save = asyncCall;
  retval.createQuery = empty;
  retval.runStream = empty;
  retval.on = asyncCallIfEnd;
  return retval;
}

/* ready function
 *
 *
 *   #####  ######   ##   #####  #   #    ###### #    # #    #  ####  ##### #  ####  #    #
 *   #    # #       #  #  #    #  # #     #      #    # ##   # #    #   #   # #    # ##   #
 *   #    # #####  #    # #    #   #      #####  #    # # #  # #        #   # #    # # #  #
 *   #####  #      ###### #    #   #      #      #    # #  # # #        #   # #    # #  # #
 *   #   #  #      #    # #    #   #      #      #    # #   ## #    #   #   # #    # #   ##
 *   #    # ###### #    # #####    #      #       ####  #    #  ####    #   #  ####  #    #
 *
 *
 */


module.exports.init = async () => {
  if (module.exports.ready) return module.exports.ready; // already initialized

  // the order here matters:
  getForbiddenUsernames();
  await getAllUsers();
  await getAllColumns();
  await getAllPapers();
  await getAllMetaanalyses();
  if (!process.env.TESTING) setupClosedBeta();

  module.exports.ready = Promise.resolve()
    .then(() => metaanalysisCache)
    .then(() => paperCache)
    .then(() => userCache)
    .then(() => {
      if (!process.env.TESTING) return;

      // load testing data
      try {
        const storageTools = require('./lib/storage-tools'); // eslint-disable-line global-require
        const data = fs.readFileSync(__dirname + '/../test/data.json', 'utf8');

        return tools.waitForPromise(storageTools.add(JSON.parse(data), { immediate: true })) // eslint-disable-line consistent-return
          .then(() => {
            console.log('storage: Testing data imported');
          });
      } catch (e) {
        console.error(e && e.stack);
      }
    })
    .then(() => console.log('storage: all is now loaded'));

  return module.exports.ready;
};
