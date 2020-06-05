export default function replaceCell(papers, columns, value, cellId) {
  console.log(value);
  console.log(cellId);
  console.log(papers);
  const papersClone = papers;

  for (const paper of papersClone) {
    for (const exp of paper.experiments) {
      for (const col of columns) {
        if (col.id) {
          if (cellId === `${exp.ctime + paper.id}+${col.id}`) {
            console.log('found the cell');
            const mapped = col.sourceColumnMap[exp.paper.id];
            exp.data[mapped].value = value;
          }
        }
      }
    }
  }
  return papersClone;
}
