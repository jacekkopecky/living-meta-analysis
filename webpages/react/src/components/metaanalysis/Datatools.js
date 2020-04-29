// find the corresponding order of values to match sourceColumnMap
export function columnOrders(papers, columns) {
  const orders = [];
  for (const paper of papers) {
    const { id } = paper;
    const columnOrder = [];
    for (const col of columns) {
      if (col.id) {
        let found = false;
        Object.entries(col.sourceColumnMap).forEach((row) => {
          if (id === row[0]) {
            columnOrder.push(row[1]);
            found = true;
          }
        });
        if (!found) columnOrder.push(undefined);
      }
    }
    orders.push(columnOrder);
  }
  return orders;
}

// DATATABLE FUNCTIONS
function generateIDHash(objects) {
  const retval = {};
  objects.forEach((obj) => {
    if (obj.id) retval[obj.id] = obj;
  });
  return retval;
}

function populateParsedFormula(col, hashcols) {
  const formula = window.lima.parseFormulaString(col.formula, hashcols);
  return formula;
}

export function populateAllParsedFormulas(columns) {
  const hashcols = generateIDHash(columns);
  const formulas = [];
  for (const col of columns) {
    if (!col.id) {
      formulas.push(populateParsedFormula(col, hashcols));
    }
  }
  return formulas;
}

function isColCompletelyDefined(col) {
  if (col == null) return false;

  if (col.id) return true;

  if (!col.formulaObj) return false;

  for (let i = 0; i < col.formulaParams.length; i++) {
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

function isExcludedExp(paperId, expIndex, excluded) {
  return excluded.indexOf(`${paperId},${expIndex}`) !== -1;
}


// TODO: Use similar function instead of columnOrder
// it may be possible to use this function to fill the table completely

// return the value of a (experiment,column) point
function getExperimentsTableDatumValue(col, paper, experiment, papers, excluded) {
  let val = null;
  if (col.id) {
    const mappedColumnId = col.sourceColumnMap[paper.id];
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
        inputs.push(getDatumValue(param, paper, experiment, papers, excluded));
      }
      val = formula.func.apply(null, inputs);
    }
    // if the result is NaN but some of the inputs were empty, change the result to empty.
    if (typeof val === 'number' && isNaN(val)) {
      if (inputs.some((x) => x == null || x === '')) val = null;
    }
  }

  return val;
}

export function getDatumValue(col, paper, experiment, papers, excluded) {
  if (isExperimentsTableColumn(col)) {
    return getExperimentsTableDatumValue(col, paper, experiment, papers, excluded);
  } if (isAggregate(col)) {
    if (col.grouping) {
      const group = getGroup(paper, experiment);
      if (group == null) {
        // no need to run the grouping aggregate if we don't have a group
        console.warn('trying to compute a grouping aggregate without a group');
        return NaN;
      }
      return getAggregateDatumValue(col, papers, excluded, group);
    }
    return getAggregateDatumValue(col, papers, excluded);
  }
}

function getAggregateDatumValue(aggregate, papers, excluded, group) {
  // ignore group if the aggregate isn't grouping
  if (!aggregate.grouping) group = null;

  // // return NaN if we have a group but don't have a grouping column
  // if (group != null && currentMetaanalysis.groupingColumnObj == null) {
  //   console.warn('trying to compute a grouping aggregate without a grouping column');
  //   return NaN;
  // }

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
            // ignore excluded values
            if (isExcludedExp(paper.id, paper.experiments.indexOf(exp), excluded)) continue;
            // ignore values with the wrong groups
            if (group != null && getGroup(paper, exp) !== group) continue;

            currentInput.push(getDatumValue(param, paper, exp));
          }
        }
      } else if (isAggregate(currentParam)) {
        if (!currentParam.grouping) {
          currentInput = getAggregateDatumValue(currentParam, papers, excluded);
        } else if (currentParam.grouping && group != null) {
          currentInput = getAggregateDatumValue(currentParam, papers, excluded, group);
        } else if (currentParam.grouping && group == null) {
          // currentParam is grouping but we don't have a group so currentInput should be an array per group
          const groups = getGroups();
          currentInput = [];
          for (const g of groups) {
            currentInput.push(getAggregateDatumValue(currentParam, g));
          }
        }
      }
      inputs.push(currentInput);
    }
    val = formula.func.apply(null, inputs);
  }

  return val;
}
