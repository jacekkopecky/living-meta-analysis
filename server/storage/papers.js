const { datastore, checkForDisallowedChanges, fillByAndCtimes } = require('./shared');
const { ValidationError, NotImplementedError } = require('../errors');
const tools = require('../lib/tools');
const users = require('./users');
const config = require('../config');

async function getPapersEnteredBy(user) {
  if (!user) {
    throw new Error('user parameter required');
  }
  const email = await users.getEmailAddressOfUser(user);
  const query = datastore.createQuery('Paper').filter('enteredBy', '=', email);
  const [papers] = await datastore.runQuery(query);
  return papers;
}

async function getPaperByTitle(user, title, time) {
  // todo if time is specified, compute a version as of that time
  if (time) throw new NotImplementedError('getPaperByTitle with time not implemented');

  if (!user || !title) {
    throw new Error('user and title parameters required');
  }

  // todo different users can use different titles for the same thing

  if (title === config.NEW_PAPER_TITLE) {
    const email = await users.getEmailAddressOfUser(user);
    return newPaper(email);
  }
  const validUser = await users.getUser(user);
  if (!validUser) return;

  const query = datastore.createQuery('Paper').filter('title', '=', title);
  const [[paper]] = await datastore.runQuery(query);

  if (paper) {
    return paper;
  }

  throw new Error('No paper found');
}

function newPaper(email) {
  const time = tools.uniqueNow();
  return {
    enteredBy: email,
    ctime: time,
    mtime: time,
  };
}

const currentPaperSave = Promise.resolve();

/**
 * @param {Paper} paper
 * @param {string} email
 * @param {string} origTitle
 * @param {} options
 * @return {Promise<Paper>}
 */
async function savePaper(paper, email, origTitle, options) {
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

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create papers with the same title
  await currentPaperSave;

  // prepare the paper for saving
  const ctime = tools.uniqueNow();
  let original = null;

  if (!paper.id) {
    paper.id = '/id/p/' + ctime;
    paper.enteredBy = email;
    paper.ctime = paper.mtime = ctime;
  } else {
    const query = datastore.createQuery('Paper').filter('id', '=', paper.id);
    const [[paperSearch]] = await datastore.runQuery(query);
    if (paperSearch) {
      original = paperSearch;

      if (options.restoring) {
        // paper is a paper we're restoring from some other datastore
        // reject the save if we already have it
        if (original) throw new Error(`paper ${paper.id} already exists`);
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
    }
  }

  // validate incoming data
  await checkForDisallowedChanges(paper, original);

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
  try {
    await datastore.save(
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
    );
    return paper;
  } catch (error) {
    console.error('error saving paper');
    console.error(error);
  }
}

module.exports = {
  getPapersEnteredBy,
  savePaper,
  getPaperByTitle,
};

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} Comment
 * @property {string} by
 * @property {string} onVersionBy
 * @property {string} text
 * @property {number} ctime
 * @property {boolean} hidden
 */

/**
 * @typedef {Object} Experiment
 * @property {string} title
 * @property {string} description
 * @property {string} enteredBy
 * @property {number} ctime
 * @property {Object.<string, ExperimentData[]>} data
 * @property {Comment[]} comments
 */

/**
 * @typedef {Object} ExperimentData
 * @property {string} value
 * @property {number} ctime
 * @property {string} enteredBy
 * @property {Comment[]} comments
 */

/**
 * @typedef {Object} Paper
 * @property {string} id
 * @property {string} title
 * @property {string} enteredBy
 * @property {number} ctime
 * @property {number} mtime
 * @property {string} reference
 * @property {string} description
 * @property {string} link
 * @property {string} doi
 * @property {string[]} tags
 * @property {string} modifiedBy
 * @property {Comment[]} comments
 * @property {string[]} columns
 * @property {Experiment[]} experiments
 */
