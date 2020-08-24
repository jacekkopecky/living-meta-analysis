function renumberComputedObjects(array, prefix) {
  prefix = prefix || '';
  let count = 0;
  array.forEach((object) => {
    if (object.formula) {
      object.number = prefix + (count += 1);
    }
  });
}

// level is how much parameter nesting we want to show:
// 0 - no parameters, e.g. sum(...)
// 1 - parameters without their parameters, e.g. sum(weight(...))
// Infinity - full nesting
function getColTitle(col, level) {
  if (col == null) {
    return 'none';
  } if (typeof col !== 'object') {
    throw new Error(`we do not expect non-object param ${col}`);
  } else if (col.id) {
    return col.title;
  } else if (col.formula) {
    return getRichColumnLabel(col, level);
  } else {
    throw new Error(`this should never happen - we do not know what title this col should have: ${col}`);
  }
}

function getFormulaLabel(formulaObj) {
  return (formulaObj ? formulaObj.label : 'no formula selected');
}

function getRichColumnLabel(col, level) {
  if (level == null) level = col.number == null ? 1 : 0;

  if (col.title && level !== Infinity) { // Don't substitute full nesting for title
    return col.title;
  }

  let retval = '';
  if (level !== Infinity && col.number != null) retval += col.number;
  if (col.grouping) retval += 'Grouping ';
  retval += `${getFormulaLabel(col.formulaObj)}(`;

  if (level === 0) {
    retval += '…';
  } else {
    for (let i = 0; i < col.formulaParams.length; i += 1) {
      retval += ` ${getColTitle(col.formulaParams[i], level - 1)}`;
      if (i < col.formulaParams.length - 1) retval += ',';
    }
    retval += ' ';
  }
  return `${retval})`;
}

// this function is the center of the app :
// it will add some data to the MA object we receive from the API so we can display them in the app
// it will also give some objects a circular reference to the parent object :
// e.g.: each experiment will have access to its parent paper
export function populateCircularMa(ma) {
  for (const paper of ma.papers) { // for each paper
    paper.metaanalysis = ma; // we add a circular ref to the entire metaanalysis object
    let i = 0;
    for (const exp of paper.experiments) { // for each experiment of a paper
      exp.index = i; // we add an index which will be usefull later
      exp.paper = paper; // we also add a reference to its parent paper
      i += 1;
    }
  }
  // ..........

  // "excluded = true" in each excluded experiment
  const hashPapers = generateIDHash(ma.papers);
  for (const excludedExp of ma.excludedExperiments) {
    const [paperId, expIndex] = excludedExp.split(',');
    if (hashPapers[paperId].experiments[expIndex] != null) {
      hashPapers[paperId].experiments[expIndex].excluded = true;
    }
  }

  ma.hashcols = generateIDHash(ma.columns);
  if (ma.groupingColumn) {
    ma.groups = getGroups(ma);
  }

  // if (ma.groupingColumns != null) {
  //   for (const groupingCol of ma.groupingColumns) {
  //   }
  // }

  renumberComputedObjects(ma.columns);

  // merges stock elements with the result of populateParsedFormula
  for (let col of ma.columns) {
    if (!col.id) {
      const colWithParsedFormula = populateParsedFormula(col, ma, ma.hashcols);
      col = Object.assign(col, colWithParsedFormula);
      col.fullLabel = getColTitle(col, Infinity);
    }
  }
  for (let aggr of ma.aggregates) {
    const aggrWithParsedFormula = populateParsedFormula(aggr, ma, ma.hashcols);
    aggr = Object.assign(aggr, aggrWithParsedFormula);
    aggr.fullLabel = getColTitle(aggr, Infinity);
  }
  for (let aggr of ma.groupingAggregates) {
    const aggrWithParsedFormula = populateParsedFormula(aggr, ma, ma.hashcols);
    aggr = Object.assign(aggr, aggrWithParsedFormula);
    aggr.fullLabel = getColTitle(aggr, Infinity);
  }
  for (let graph of ma.graphs) {
    const aggrWithParsedFormula = populateParsedFormula(graph, ma, ma.hashcols);
    graph = Object.assign(graph, aggrWithParsedFormula);
    graph.fullLabel = getColTitle(graph, Infinity);
  }
}

// "converts" an object into one that is easier to manipulate
function generateIDHash(objects) {
  const retval = {};
  objects.forEach((obj) => {
    if (obj.id) retval[obj.id] = obj;
  });
  return retval;
}

export function formatNumber(x) {
  if (typeof x !== 'number') return x;
  const xabs = Math.abs(x);
  // if (xabs >= 1000) return x.toFixed(0);
  // this would drop the decimal point from large values (needs tweaks in padNumber below)
  if (xabs >= 100) return x.toFixed(1);
  if (xabs >= 10) return x.toFixed(2);
  // if (xabs >= 1) return x.toFixed(2);
  return x.toFixed(3);
}

function populateParsedFormula(col, ma, hashcols) {
  const formula = window.lima.parseFormulaString(col.formula, hashcols);
  formula.metaanalysis = ma;
  return formula;
}

export function isColCompletelyDefined(col) {
  if (col == null) return false;
  if (col.id) return true;
  if (!col.formulaObj) return false;
  for (let i = 0; i < col.formulaParams.length; i += 1) {
    if (!isColCompletelyDefined(col.formulaParams[i])) {
      return false;
    }
  }
  return true;
}

function isExperimentsTableColumn(col) {
  return col.id || (col.formulaObj && col.formulaObj.type === window.lima.FORMULA_TYPE);
}

function isAggregate(col) {
  return col.formulaObj && col.formulaObj.type === window.lima.AGGREGATE_TYPE;
}

function getExperimentsTableDatumValue(col, experiment) {
  let val = null;
  if (col.id) {
    const mappedColumnId = col.sourceColumnMap[experiment.paper.id];
    // not a computed column
    if (experiment
        && experiment.data
        && experiment.data[mappedColumnId]
        && experiment.data[mappedColumnId].value != null) {
      val = experiment.data[mappedColumnId].value;
    }
  } else {
    // computed column
    const inputs = [];

    if (isColCompletelyDefined(col)) {
      const formula = col.formulaObj;
      if (formula == null) return NaN;
      // compute the value
      // if anything here throws an exception, value cannot be computed
      for (const param of col.formulaParams) {
        inputs.push(getDatumValue(param, experiment));
      }
      val = formula.func.apply(null, inputs);
    }
    // if the result is NaN but some of the inputs were empty, change the result to empty.
    if (typeof val === 'number' && Number.isNaN(val)) {
      if (inputs.some((x) => x == null || x === '')) val = null;
    }
  }

  return val;
}

export function getDatumValue(col, experiment) {
  const { papers } = experiment.paper.metaanalysis;
  if (isExperimentsTableColumn(col)) {
    return getExperimentsTableDatumValue(col, experiment);
  }

  if (isAggregate(col)) {
    if (col.grouping) {
      const group = getGroup(experiment);
      if (group == null) {
        // no need to run the grouping aggregate if we don't have a group
        console.warn('trying to compute a grouping aggregate without a group');
        return NaN;
      } else {
        return getAggregateDatumValue(col, papers, group);
      }
    } else {
      return getAggregateDatumValue(col, papers);
    }
  }

  return null;
}

export function getAggregateDatumValue(aggregate, papers, group, moderator) {
  const ma = papers[0].metaanalysis; // TODO: probably a bug here
  if (!aggregate.grouping) group = null;

  // return NaN if we have a group but don't have a grouping column
  if (group != null && ma.groupingColumnObj == null) {
    console.warn('trying to compute a grouping aggregate without a grouping column');
    return NaN;
  }

  const inputs = [];
  let val;
  if (isColCompletelyDefined(aggregate)) {
    const formula = aggregate.formulaObj;
    if (formula == null) return NaN;

    // compute the value
    // if anything here throws an exception, value cannot be computed
    for (const param of aggregate.formulaParams) {
      let currentInput;
      if (isExperimentsTableColumn(param)) {
        currentInput = [];
        for (const paper of papers) {
          for (const exp of paper.experiments) {
            if (!exp.excluded && !(group != null && getGroup(exp, moderator) !== group)) {
              currentInput.push(getDatumValue(param, exp));
            }
          }
        }
      } else if (isAggregate(param)) {
        if (!param.grouping) {
          currentInput = getAggregateDatumValue(param, papers, undefined);
        } else if (param.grouping && group != null) {
          currentInput = getAggregateDatumValue(param, papers, group);
        } else if (param.grouping && group == null) {
          // currentParam is grouping but we don't have a group
          // so currentInput should be an array per group
          const groups = getGroups(ma);
          currentInput = [];
          for (const g of groups) {
            currentInput.push(getAggregateDatumValue(param, papers, g));
          }
        }
      }
      inputs.push(currentInput);
    }
    val = formula.func.apply(null, inputs);
  }

  return val;
}

function getGroup(experiment, moderatorObj) {
  const { groupingColumnObj } = experiment.paper.metaanalysis;
  if (!moderatorObj) {
    moderatorObj = groupingColumnObj;
  }
  if (moderatorObj) {
    return getDatumValue(moderatorObj, experiment);
  } else {
    return null;
  }
}

export function getGroups(ma) {
  const groupingColumnObj = window.lima.parseFormulaString(ma.groupingColumn, ma.hashcols);
  ma.groupingColumnObj = groupingColumnObj;
  if (!groupingColumnObj) return [];

  const groups = [];
  for (const paper of ma.papers) {
    for (const exp of paper.experiments) {
      if (!exp.excluded) {
        const group = getGroup(exp);
        if (group != null && group !== '' && groups.indexOf(group) === -1) {
          groups.push(group);
        }
      }
    }
  }

  groups.sort(); // alphabetically
  return groups;
}

function twoDigits(x) {
  return x < 10 ? `0${x}` : `${x}`;
}

// this function is used each time we display ctime or mtime
export function formatDateTime(timestamp) {
  const d = new Date(timestamp);

  const date = `${d.getFullYear()}-${twoDigits((d.getMonth() + 1))}-${twoDigits(d.getDate())}`;
  const time = `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}`;
  const datetime = `${date} ${time}`;
  return datetime;
}

// this function is used to split date and time separately
export function formatDateTimeSplit(timestamp) {
  const d = new Date(timestamp);

  const date = `${d.getFullYear()}-${twoDigits((d.getMonth() + 1))}-${twoDigits(d.getDate())}`;
  const time = `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}`;
  return { date: `${date}`, time: `${time}` };
}
