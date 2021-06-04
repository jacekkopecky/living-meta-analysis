let mapped;
export default function replaceCell(papers, columns, value, cellId, currentUser) {
  const papersClone = [...papers];
  for (const paper of papersClone) {
    for (const exp of paper.experiments) {
      for (const col of columns) {
        if (col.id) {
          mapped = col.sourceColumnMap[exp.paper.id];
          if (cellId === `${exp.ctime + paper.id}+${col.id}`) {
            setDefaultData(paper, col, exp);
            exp.data[mapped].value = value;
            setOtherData(exp, currentUser);
          }
        }
      }
    }
  }
  return papersClone;
}

function setDefaultData(paper, col, exp) {
  // if the paper does not have data for this column
  if (!mapped) {
    // Assign each of its papers default data for the column,
    // indexed by the maximum length of the paper's data attribute
    let index;
    for (const exper of paper.experiments) {
      if (!index || index < Object.keys(exper.data).length) {
        index = Object.keys(exper.data).length;
      }
      exper.data[index + 1] = {
        ctime: null,
        enteredBy: null,
        value: null,
      };
    }
    // Set the source map for the column to reflect the index
    col.sourceColumnMap[exp.paper.id] = index + 1;
    mapped = col.sourceColumnMap[exp.paper.id];
  }
}

function setOtherData(exp, currentUser) {
  // If the paper's data for the column is still default
  // set it to correct values
  if (exp.data[mapped].ctime === null) {
    const newTime = new Date().getTime();
    exp.data[mapped].ctime = newTime;
    exp.data[mapped].enteredBy = currentUser.displayName;
  }
}
