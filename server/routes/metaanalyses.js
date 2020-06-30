const { NotFoundError, ValidationError, NotImplementedError, InternalError } = require('../errors');
const storage = require('../storage');
const config = require('../config');
const tools = require('../lib/tools');
const { extractPaperForSending, extractReceivedComment } = require('./papers');

/* -------------------------------------------------------------------------- */
/*                               Route Handlers                               */
/* -------------------------------------------------------------------------- */

async function listMetaanalysesForUser(req, res, next) {
  try {
    const mas = await storage.metaanalyses.getMetaanalysesEnteredBy(req.params.user);
    if (mas.length === 0) throw new Error('no metaanalyses found');

    const retval = [];
    mas.forEach((m) => {
      retval.push(extractMetaanalysisForSending(m, false, req.params.user));
    });
    res.json(retval);
  } catch (error) {
    next(new NotFoundError());
  }
}

async function getMetaanalysisVersion(req, res, next) {
  try {
    const ma = await storage.metaanalyses.getMetaanalysisByTitle(req.params.user, req.params.title, req.params.time, true);
    const username = await storage.users.getUsernameOfUser(ma.enteredBy);
    res.json(extractMetaanalysisForSending(ma, true, req.params.user, username));
  } catch (e) {
    next(e && e.status ? e : new NotFoundError());
  }
}

async function saveMetaanalysis(req, res, next) {
  // extract from incoming data stuff that is allowed
  try {
    const ma = await storage.metaanalyses.saveMetaanalysis(extractReceivedMetaanalysis(req.body), req.user.emails[0].value, req.params.title);
    res.json(extractMetaanalysisForSending(ma, false, req.params.user));
  } catch (e) {
    console.log(e);
    if (e instanceof ValidationError || e instanceof NotImplementedError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  }
}

async function listTopMetaanalyses(req, res, next) {
  try {
    const mas = await storage.metaanalyses.listMetaanalyses();

    const retval = [];
    for (const ma of mas) {
      retval.push({
        title: ma.title,
        enteredBy: ma.enteredBy,
      });
    }
    res.json(retval);
  } catch (error) {
    console.log(error);

    next(new InternalError());
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function extractMetaanalysisForSending(storageMetaanalysis, includePapers, user, username) {
  const retval = {
    id: storageMetaanalysis.id,
    title: storageMetaanalysis.title,
    enteredBy: storageMetaanalysis.enteredBy,
    enteredByUsername: username,
    ctime: storageMetaanalysis.ctime,
    mtime: storageMetaanalysis.mtime,
    published: storageMetaanalysis.published,
    description: storageMetaanalysis.description,
    tags: storageMetaanalysis.tags,
    columns: storageMetaanalysis.columns,
    paperOrder: storageMetaanalysis.paperOrder,
    hiddenCols: storageMetaanalysis.hiddenCols,
    hiddenExperiments: storageMetaanalysis.hiddenExperiments,
    excludedExperiments: storageMetaanalysis.excludedExperiments,
    aggregates: storageMetaanalysis.aggregates,
    groupingColumn: storageMetaanalysis.groupingColumn,
    groupingAggregates: storageMetaanalysis.groupingAggregates,
    graphs: storageMetaanalysis.graphs,
    // todo comments in various places?
  };

  if (user) retval.apiurl = apiMetaanalysisURL(user, retval.title);

  if (includePapers && storageMetaanalysis.papers) {
    retval.papers = [];
    storageMetaanalysis.papers.forEach((p) =>
      retval.papers.push(extractPaperForSending(p, true, user)),
    );
  }

  return retval;
}

function extractReceivedMetaanalysis(receivedMetaanalysis) {
  // expecting receivedMetaanalysis to come from JSON.parse()
  const retval = {
    id: tools.string(receivedMetaanalysis.id), // identifies the MA to be changed
    title: tools.string(receivedMetaanalysis.title),
    CHECKenteredBy: tools.string(receivedMetaanalysis.enteredBy), // can't be changed but should be checked
    CHECKctime: tools.number(receivedMetaanalysis.ctime), // can't be changed but should be checked
    // mtime: tools.number(receivedMetaanalysis.mtime),              // will be updated
    published: tools.string(receivedMetaanalysis.published),
    description: tools.string(receivedMetaanalysis.description),
    tags: tools.array(receivedMetaanalysis.tags, tools.string),
    columns: tools.array(receivedMetaanalysis.columns, extractReceivedMetaanalysisColumnEntry),
    paperOrder: tools.array(receivedMetaanalysis.paperOrder, tools.string),
    hiddenCols: tools.array(receivedMetaanalysis.hiddenCols, tools.string),
    hiddenExperiments: tools.array(receivedMetaanalysis.hiddenExperiments, tools.string),
    excludedExperiments: tools.array(receivedMetaanalysis.excludedExperiments, tools.string),
    aggregates: tools.array(receivedMetaanalysis.aggregates, extractReceivedAggregate),
    groupingColumn: tools.string(receivedMetaanalysis.groupingColumn),
    groupingAggregates: tools.array(receivedMetaanalysis.groupingAggregates, extractReceivedAggregate),
    graphs: tools.array(receivedMetaanalysis.graphs, extractReceivedGraph),
  };

  return retval;
}

function extractReceivedColumnEntry(recCol) {
  if (typeof recCol === 'object') {
    return {
      id: tools.string(recCol.id),
      title: tools.string(recCol.title),
      description: tools.string(recCol.description),
      type: tools.string(recCol.type),
      formula: tools.string(recCol.formula),
      comments: tools.array(recCol.comments, extractReceivedComment),
      obsoleteIDForMigration: tools.string(recCol.obsoleteIDForMigration),
    };
  }

  return undefined;
}

function extractReceivedMetaanalysisColumnEntry(recCol) {
  const col = extractReceivedColumnEntry(recCol);
  if (col) {
    col.sourceColumnMap = tools.assoc(recCol.sourceColumnMap, tools.string);
    delete col.obsoleteIDForMigration;
  }

  return col;
}

function extractReceivedAggregate(recAggr) {
  // expecting receivedAggregate to come from JSON.parse()
  return {
    formula: tools.string(recAggr.formula),
    comments: tools.array(recAggr.comments, extractReceivedComment),
    title: tools.string(recAggr.title),
  };
}

function extractReceivedGraph(recGraph) {
  // uses a formula string just like computed columns and aggregates
  return {
    formula: tools.string(recGraph.formula),
    comments: tools.array(recGraph.comments, extractReceivedComment),
    title: tools.string(recGraph.title),
  };
}

function apiMetaanalysisURL(user, title) {
  return `/api/metaanalyses/${user}/${title || config.NEW_META_TITLE}`;
}

module.exports = {
  listMetaanalysesForUser,
  getMetaanalysisVersion,
  saveMetaanalysis,
  listTopMetaanalyses,
};
