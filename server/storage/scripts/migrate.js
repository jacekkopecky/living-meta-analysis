'use strict';
const { datastore } = require('../shared');

/*
 * change metaanalysis from an old format to the new one on load from datastore, if need be
 */
async function migrateMetaanalysis(metaanalysis) {
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
  const maPapers = await Promise.all(metaanalysis.paperOrder.map(async (paperId) => {
    // find the paper with the matching ID
    const query = datastore.createQuery('Paper').filter('id', '=', paperId);
    const [retval] = await datastore.runQuery(query);
    if (retval.length === 0) {
      throw new Error(`metaanalysis ${metaanalysis.title} has a paper ${paperId} that isn't in the datastore`);
    }
    return retval[0];
  }));

  // convert columns from string to object
  if (!metaanalysis.columns) metaanalysis.columns = [];
  let maxId = 0;
  metaanalysis.columns.forEach(async (col, colIndex) => {
    if (typeof col === 'string') {
      // migrate the string into an object
      const query = datastore.createQuery('Column').filter('id', '=', col);
      const [retval] = await datastore.runQuery(query);
      if (retval.length === 0) throw new Error(`metaanalysis ${metaanalysis.title} uses nonexistent column ${col}`);
      const column = retval[0];
      const colObject = {
        id: '' + (maxId += 1),
        title: column.title,
        description: column.description,
        type: column.type,
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

async function migrateAllUsers() {
  const kind = 'User';
  const [retval] = await datastore.createQuery(kind).run();
  const entities = [];
  retval.forEach(user => {
    const val = migrateUser(user);
    const userKey = datastore.key([kind, val.email]);
    entities.push({
      key: userKey,
      data: val,
    });
  });
  await datastore.upsert(entities);
}

async function migrateAllPapers() {
  const columns = await getAllColumns();
  const kind = 'Paper';
  const [retval] = await datastore.createQuery(kind).run();
  const entities = [];
  retval.forEach(element => {
    const val = migratePaper(element, columns);
    const paperKey = datastore.key([kind, element.id]);
    entities.push({
      key: paperKey,
      data: val,
    });
  });
  await datastore.upsert(entities);
}

async function migrateAllMetaanalysis() {
  const kind = 'Metaanalysis';
  const [retval] = await datastore.createQuery(kind).run();
  const entities = [];
  for (const element of retval) {
    try {
      const val = await migrateMetaanalysis(element);
      const metaanalysisKey = datastore.key([kind, val.id]);
      entities.push({
        key: metaanalysisKey,
        data: val,
      });
    } catch (error) {
      console.log(error);
    }
  }
  await datastore.upsert(entities);
}

async function migrate() {
  await migrateAllUsers();
  await migrateAllPapers();
  await migrateAllMetaanalysis();
  console.log('Migration complete');
}

migrate();
