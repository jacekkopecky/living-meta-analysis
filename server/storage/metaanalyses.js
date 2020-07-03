const { datastore, checkForDisallowedChanges, fillByAndCtimes } = require('./shared');
const users = require('./users');
const tools = require('../lib/tools');
const config = require('../config');
const { ValidationError, NotImplementedError, InternalError } = require('../errors');


async function getMetaanalysesEnteredBy(user) {
  // todo also return metaanalyses contributed to by `email`
  if (!user) {
    throw new Error('user parameter required');
  }

  const email = await users.getEmailAddressOfUser(user);
  const query = datastore.createQuery('Metaanalysis').filter('enteredBy', '=', email);

  try {
    const [metaanalyses] = await datastore.runQuery(query);
    return metaanalyses;
  } catch (error) {
    throw new InternalError();
  }
}

async function getMetaanalysisByTitle(user, title, time, includePapers) {
  // todo if time is specified, compute a version as of that time
  if (time) {
    throw new NotImplementedError('getMetaanalysisByTitle with time not implemented');
  }

  // todo different users can use different titles for the same thing

  if (title === config.NEW_META_TITLE) {
    const email = await users.getEmailAddressOfUser(user);
    return newMetaanalysis(email);
  }

  // const metaanalyses = await getAllMetaanalyses();
  const query = datastore.createQuery('Metaanalysis').filter('title', '=', title);

  const [[metaanalyses]] = await datastore.runQuery(query);
  if (metaanalyses) {
    let ma = metaanalyses;
    if (includePapers) {
      ma = await getMetaanalysisWithPapers(ma, time);
    }
    return ma;
  }

  throw new Error('No metaanalysis found');
}

async function getMetaanalysisWithPapers(ma, time) {
  if (time) {
    throw new NotImplementedError('getMetaanalysisWithPapers with time not implemented');
  }

  if (!ma.paperOrder || ma.paperOrder.length === 0) return ma;

  // use a shallow copy of ma
  ma = { ...ma };

  const createDatastoreKey = (id) => datastore.key(['Paper', id]);
  const keys = ma.paperOrder.map(createDatastoreKey);

  const [papers] = await datastore.get(keys);

  ma.papers = [];
  // populate the papers array in the order of ma.paperOrder
  papers.forEach((p) => {
    const index = ma.paperOrder.indexOf(p.id);
    if (index !== -1) ma.papers[index] = p;
  });

  return ma;
}

async function listMetaanalyses() {
  const query = datastore.createQuery('Metaanalysis');
  const [retval] = await datastore.runQuery(query);
  return retval;
}

function newMetaanalysis(email) {
  const time = tools.uniqueNow();
  return {
    enteredBy: email,
    ctime: time,
    mtime: time,
  };
}

// const currentMetaanalysisSave = Promise.resolve();

async function saveMetaanalysis(metaanalysis, email, origTitle, options) {
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

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create metaanalyses with the same title

  // await currentMetaanalysisSave;

  // prepare the metaanalysis for saving
  const ctime = tools.uniqueNow();
  let original = null;
  if (!metaanalysis.id) {
    metaanalysis.id = '/id/ma/' + ctime;
    metaanalysis.enteredBy = email;
    metaanalysis.ctime = metaanalysis.mtime = ctime;
  } else {
    const query = datastore.createQuery('Metaanalysis').filter('id', '=', metaanalysis.id);
    const [[retval]] = await datastore.runQuery(query);
    original = retval || null;

    if (options.restoring) {
      // metaanalysis is a metaanalysis we're restoring from some other datastore
      // reject the save if we already have it
      if (original) throw new Error(`metaanalysis ${metaanalysis.id} already exists`);
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
  }

  // validate incoming data
  await checkForDisallowedChanges(metaanalysis, original);

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

  try {
    await datastore.save([
      { key, data: metaanalysis },
      {
        key: logKey,
        data: [
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
    ]);
    return metaanalysis;
  } catch (error) {
    console.error('error saving metaanalysis', error);
    throw error;
  }
}

module.exports = {
  saveMetaanalysis,
  getMetaanalysisByTitle,
  getMetaanalysesEnteredBy,
  listMetaanalyses,
};

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} Metaanalysis
 * @property {string} title
 * @property {string} enteredBy
 * @property {number} ctime
 * @property {number} mtime
 * @property {string} published
 * @property {string} description
 * @property {string[]} tags
 */
