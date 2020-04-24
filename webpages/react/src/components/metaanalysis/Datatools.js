export function computeColumns(columns) {
  const dataColumns = [];
  const formulasColumns = [];
  for (const col of columns) {
    if (col.sourceColumnMap === undefined) {
      formulasColumns.push({
        // no id for formulas columns
        title: col.title,
        formula: col.formula,
        map: col.sourceColumnMap,
      });
    } else {
      dataColumns.push({
        id: col.id,
        title: col.title,
        map: col.sourceColumnMap,
      });
    }
  }

  const computedColumns = {
    dataColumns,
    formulasColumns,
  };
  return computedColumns;
}

function findColumnOrder(papers, columns) {
  for (const paper of papers) {
    const { id } = paper;
    const columnOrder = [];
    for (const col of columns.dataColumns) {
      let found = false;
      Object.entries(col.map).forEach((row) => {
        if (id === row[0]) {
          columnOrder.push(row[1]);
          found = true;
        }
      });
      if (!found) columnOrder.push(undefined);
    }
    paper.columnOrder = columnOrder;
  }
}

export function computePapers(papers, computedColumns) {
  const computedPapers = [];
  for (const paper of papers) {
    computedPapers.push({
      id: paper.id,
      title: paper.title,
      nExp: paper.experiments.length,
      experiments: paper.experiments.map((exp) => ({
        title: exp.title,
        ctime: exp.ctime,
        values: Object.values(exp.data).map((value) => value.value),
        index: Object.keys(exp.data).map((value) => value),
      })),
    });
  }
  findColumnOrder(computedPapers, computedColumns);
  return computedPapers;
}
