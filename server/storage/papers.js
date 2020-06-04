const { allTitles, datastore, checkForDisallowedChanges, fillByAndCtimes } = require('./shared');
const { ValidationError, NotImplementedError } = require('../errors');
const tools = require('../lib/tools');
const users = require('./users');
const config = require('../config');


async function getAllColumns() {
  try {
    console.log('getAllColumns: making a datastore request');
    const retval = {};
    const [results] = await datastore.createQuery('Column').run();

    results.forEach((result) => {
      try {
        retval[result.id] = result;
      } catch (error) {
        console.error('error in a column entity (ignoring)', error);
      }
    });

    console.log(`getAllColumns: ${Object.keys(retval).length} done`);
    return retval;
  } catch (error) {
    console.error('error retrieving columns', error);
    setTimeout(getAllColumns, 60 * 1000); // try loading again in a minute
    throw error;
  }
}

/**
 * @return {Promise<Paper[]>}
 */
async function getAllPapers() {
  const columns = await getAllColumns();
  try {
    const [retval] = await datastore.createQuery('Paper').run();
    retval.forEach(val => {
      val = migratePaper(val, columns);
      allTitles.push(val.title);
    });
    console.log(`getAllPapers: ${retval.length} done`);
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


async function getPapersEnteredBy(user) {
  if (!user) {
    throw new Error('user parameter required');
  }
  const email = await users.getEmailAddressOfUser(user);
  const papers = await getAllPapers();
  return papers.filter(p => p.enteredBy === email);
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

  const papers = await getAllPapers();
  for (const p of papers) {
    if (p.title === title) {
      return title;
    }
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

function listPapers() {
  return getAllPapers();
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

  let doAddPaperToCache;

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create papers with the same title
  await currentPaperSave;
  const papers = await getAllPapers();
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
      if (papers[i].id === paper.id) { // todo change getAllPapers() to be indexed by id?
        original = papers[i];
        break;
      }
    }

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
    doAddPaperToCache();
    return paper;
  } catch (error) {
    console.error('error saving paper');
    console.error(error);
  }
}

module.exports = {
  getAllPapers,
  migratePaper,
  getPapersEnteredBy,
  savePaper,
  getPaperByTitle,
  listPapers,
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
