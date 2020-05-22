const { allTitles, datastore, checkForDisallowedChanges, fillByAndCtimes } = require('./index');
const users = require('./users');
const { getAllPapers } = require('./papers');
const tools = require('../lib/tools');
const config = require('../config');
const { ValidationError, NotImplementedError } = require('../errors');

// const metaanalysisCache = getAllMetaanalyses();

/**
 * @return {Promise<Metaanalysis[]>}
 */
async function getAllMetaanalyses() {
  // const columns = columnCache;
  const papers = await getAllPapers();

  // if (!columns) throw new Error('No columns in cache');
  if (!papers) throw new Error('No papers in cache');

  try {
    console.log('getAllMetaanalyses: making a datastore request');
    const [retval] = await datastore.createQuery('Metaanalysis').run();
    // retval.forEach(val => {
    //   migrateMetaanalysis(val, papers, columns);
    //   allTitles.push(val.title);
    // });
    console.log(`getAllMetaanalyses: ${retval.length} done`);
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


async function getMetaanalysesEnteredBy(user) {
  // todo also return metaanalyses contributed to by `email`
  if (!user) {
    throw new Error('user parameter required');
  }

  const metaanalysis = await getAllMetaanalyses();
  const email = await users.getEmailAddressOfUser(user);

  return metaanalysis.filter(ma => ma.enteredBy === email);
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

  const metaanalyses = await getAllMetaanalyses();
  for (let ma of metaanalyses) {
    if (ma.title === title) {
      if (includePapers) {
        // use a shallow copy of ma
        ma = getMetaanalysisWithPapers(ma, time);
      }
      return ma;
    }
  }
  throw new Error('No metaanalysis found');
}

async function getMetaanalysisWithPapers(ma, time) {
  if (time) {
    throw new NotImplementedError('getMetaanalysisWithPapers with time not implemented');
  }

  const papers = await getAllPapers();
  // use a shallow copy of ma
  ma = { ...ma };

  ma.papers = [];
  // populate the papers array in the order of ma.paperOrder
  papers.forEach((p) => {
    const index = ma.paperOrder.indexOf(p.id);
    if (index !== -1) ma.papers[index] = p;
  });

  return ma;
}

function newMetaanalysis(email) {
  const time = tools.uniqueNow();
  return {
    enteredBy: email,
    ctime: time,
    mtime: time,
  };
}

function listMetaanalyses() {
  return getAllMetaanalyses();
}

const currentMetaanalysisSave = Promise.resolve();

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

  let doAddMetaanalysisToCache;

  // the following serializes this save after the previous one, whether it fails or succeeds
  // this way we can't have two concurrent saves create metaanalyses with the same title

  await currentMetaanalysisSave;
  const metaanalyses = await getAllMetaanalyses();

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
      if (metaanalyses[i].id === metaanalysis.id) { // todo change getAllMetaanalyses() to be indexed by id?
        original = metaanalyses[i];
        break;
      }
    }

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
    doAddMetaanalysisToCache();
    return metaanalysis;
  } catch (error) {
    console.error('error saving metaanalysis', error);
    throw error;
  }
}

module.exports = {
  getAllMetaanalyses,
  saveMetaanalysis,
  listMetaanalyses,
  getMetaanalysisByTitle,
  getMetaanalysesEnteredBy,
  migrateMetaanalysis,
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
