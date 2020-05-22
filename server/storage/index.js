
const config = require('../config');
const { ValidationError } = require('../errors');
const tools = require('../lib/tools');
const { Datastore } = require('@google-cloud/datastore');

const datastore = process.env.TESTING ? createStubDatastore()
  : new Datastore({
    projectId: config.gcloudProject.projectId,
    keyFilename: config.gcloudProject.keyFilename,
    namespace: config.gcloudDatastoreNamespace,
  });

module.exports.datastore = datastore;

const metaanalyses = require('./metaanalyses');
const papers = require('./papers');
const users = require('./users');

const TITLE_REXP = new RegExp(`^${config.TITLE_RE}$`);
const USERNAME_REXP = new RegExp(`^${config.USERNAME_RE}$`);

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
  module.exports.betaCodes = { 'app-engine': {} };

  // // load the invitation codes from a file for now
  // // every line has an invite code and after # possibly a comment
  // // to generate an invite, there are instructions in the README
  // // todo load the codes from the data store and have a management interface, update the README
  // (function () {
  //   let invites;
  //   try {
  //     invites = fs.readFileSync('./invites.txt', 'utf8');
  //   } catch (e) {
  //     // let it crash
  //     throw new Error('BETA: need the file ./invites.txt to allow anybody in the server');
  //   }
  //   const lines = invites.split(/\n/);
  //   lines.forEach((line) => {
  //     const code = line.split('#')[0].trim();
  //     if (code) module.exports.betaCodes[code] = {};
  //   });
  //   if (Object.keys(module.exports.betaCodes).length === 0) {
  //     throw new Error('BETA: need invite codes in ./invites.txt to allow anybody in the server');
  //   }
  //   console.log(`BETA: got ${Object.keys(module.exports.betaCodes).length} invites`);
  // }());

  // // when we touch a beta code (someone uses it in a request), store:
  // //   last access (trigger a save if more than 24h after the last one)
  // //   logged-in email address if available (triggers a save if a new address there)
  // //   access count per email address per day for the last 7 days
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

function setup() {
  setupClosedBeta();
}

// module.exports = {
//   setup,
//   datastore,
//   metaanalyses,
//   papers,
//   users,
// };


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
    if (users.allUsernames.indexOf(current.username.toLowerCase()) !== -1) {
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

// async function listTitles() {
//   await metaanalysisCache;
//   await paperCache;
//   return allTitles;
// }

module.exports = {
  allTitles,
  // listTitles,
  checkForDisallowedChanges,
  fillByAndCtimes,
  setup,
  metaanalyses,
  papers,
  users,
};
