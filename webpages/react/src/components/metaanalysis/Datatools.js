export function computeColumns(columns) {
  const computedColumns = [];
  columns.forEach((col) => {
    computedColumns.push({
      id: col.id,
      title: col.title,
      map: col.sourceColumnMap,
    });
  });
  return computedColumns;
}

function computeColumnOrder(papers, columns) {
  const lstMap = [];
  columns.forEach((col) => {
    const { sourceColumnMap } = col;
    if (sourceColumnMap !== undefined) {
      lstMap.push(sourceColumnMap);
    }
  });
  papers.forEach((paper) => {
    const { id } = paper;
    const columnOrder = [];
    lstMap.forEach((map) => {
      let found = false;
      Object.entries(map).forEach((row) => {
        if (id === row[0]) {
          columnOrder.push(row[1]);
          found = true;
        }
      });
      if (!found) columnOrder.push(undefined);
    });
    paper.columnOrder = columnOrder;
  });
}

export function computePapers(papers, columns) {
  const computedPapers = [];
  papers.forEach((paper) => {
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
  });
  computeColumnOrder(computedPapers, columns);
  return computedPapers;
}
