const { NotFoundError, ValidationError, NotImplementedError, InternalError } = require('../errors');
const storage = require('../storage');
const config = require('../config');
const tools = require('../lib/tools');

/* -------------------------------------------------------------------------- */
/*                               Route Handlers                               */
/* -------------------------------------------------------------------------- */

async function listPapersForUser(req, res, next) {
  try {
    const papers = await storage.papers.getPapersEnteredBy(req.params.user);
    if (papers.length === 0) throw new Error('no papers found');

    const retval = [];
    papers.forEach(p => {
      retval.push(extractPaperForSending(p, false, req.params.user));
    });
    res.json(retval);
  } catch (error) {
    next(new NotFoundError());
  }
}

async function getPaperVersion(req, res, next) {
  try {
    const paper = await storage.papers.getPaperByTitle(req.params.user, req.params.title);
    const username = await storage.users.getUsernameOfUser(paper.enteredBy);
    res.json(extractPaperForSending(paper, true, req.params.user, username));
  } catch (e) {
    next(e.status ? e : new NotFoundError());
  }
}

async function savePaper(req, res, next) {
  // extract from incoming data stuff that is allowed
  try {
    const p = await storage.papers.savePaper(
      extractReceivedPaper(req.body),
      req.user.emails[0].value,
      req.params.title);
    res.json(extractPaperForSending(p, true, req.params.user));
  } catch (e) {
    if (e instanceof ValidationError || e instanceof NotImplementedError) {
      next(e);
    } else {
      next(new InternalError(e));
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function extractPaperForSending(storagePaper, includeDataValues, user, username) {
  const retval = {
    id: storagePaper.id,
    title: storagePaper.title,
    enteredBy: storagePaper.enteredBy,
    enteredByUsername: username,
    ctime: storagePaper.ctime,
    mtime: storagePaper.mtime,
    reference: storagePaper.reference,
    description: storagePaper.description,
    link: storagePaper.link,
    doi: storagePaper.doi,
    tags: storagePaper.tags,
    // todo comments in various places?
  };

  if (user) retval.apiurl = apiPaperURL(user, retval.title);

  if (includeDataValues) {
    retval.experiments = storagePaper.experiments;
    retval.columns = storagePaper.columns;
    retval.hiddenCols = storagePaper.hiddenCols;
  }

  return retval;
}

function extractReceivedPaper(receivedPaper) {
  // expecting receivedPaper to come from JSON.parse()
  const retval = {
    id: tools.string(receivedPaper.id), // identifies the paper to be changed
    title: tools.string(receivedPaper.title),
    CHECKenteredBy: tools.string(receivedPaper.enteredBy), // can't be changed but should be checked
    CHECKctime: tools.number(receivedPaper.ctime), // can't be changed but should be checked
    // mtime: tools.number(receivedPaper.mtime),           // will be updated
    reference: tools.string(receivedPaper.reference),
    description: tools.string(receivedPaper.description),
    link: tools.string(receivedPaper.link),
    doi: tools.string(receivedPaper.doi),
    tags: tools.array(receivedPaper.tags, tools.string),
    experiments: tools.array(receivedPaper.experiments, extractReceivedExperiment),
    columns: tools.array(receivedPaper.columns, extractReceivedColumnEntry),
    hiddenCols: tools.array(receivedPaper.hiddenCols, tools.string),
  };

  // todo anything else recently added to the data

  return retval;
}

function extractReceivedExperiment(receivedExperiment) {
  const retval = {
    title: tools.string(receivedExperiment.title),
    CHECKenteredBy: tools.string(receivedExperiment.enteredBy),
    CHECKctime: tools.number(receivedExperiment.ctime),
    description: tools.string(receivedExperiment.description),
    data: tools.assoc(receivedExperiment.data, extractReceivedExperimentDatum),
    comments: tools.array(receivedExperiment.comments, extractReceivedComment),
  };
  return retval;
}

function extractReceivedExperimentDatum(receivedDatum) {
  const retval = {
    value: tools.string(receivedDatum.value),
    CHECKenteredBy: tools.string(receivedDatum.enteredBy),
    CHECKctime: tools.number(receivedDatum.ctime),
    comments: tools.array(receivedDatum.comments, extractReceivedComment),
  };
  return retval;
}

function extractReceivedComment(receivedComment) {
  const retval = {
    CHECKby: tools.string(receivedComment.by),
    CHECKctime: tools.number(receivedComment.ctime),
    onVersionBy: tools.string(receivedComment.onVersionBy),
    text: tools.string(receivedComment.text),
    hidden: tools.bool(receivedComment.hidden),
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

function apiPaperURL(user, title) {
  return `/api/papers/${user}/${title || config.NEW_PAPER_TITLE}`;
}

module.exports = {
  listPapersForUser,
  getPaperVersion,
  savePaper,
  extractPaperForSending,
};
