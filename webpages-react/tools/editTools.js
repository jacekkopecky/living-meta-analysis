export default function replaceCell(papers, columns, value, cellId) {
  const papersClone = [...papers];
  for (const paper of papersClone) {
    for (const exp of paper.experiments) {
      for (const col of columns) {
        if (col.id) {
          if (cellId === `${exp.ctime + paper.id}+${col.id}`) {
            const mapped = col.sourceColumnMap[exp.paper.id];
            exp.data[mapped].value = value;
          }
        }
      }
    }
  }
  return papersClone;
}
