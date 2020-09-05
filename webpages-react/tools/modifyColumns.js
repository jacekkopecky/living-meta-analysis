// These functions are used to manually assign additional atributes to the column objects.
// This is only necessary when working with a static webpage;
// in future versions of LiMA these attributes and values will be saved on the server.

// Temporary manual assignment of column subtypes
const assignSubType = (cols) => {
  const columnsClone = [...cols];
  columnsClone.forEach((column) => {
    if (!column.subType) {
      if (column.id === '1') {
        column.subType = 'pspecific';
        column.inputType = 'string';
      } else if (column.id === '2' || column.id === '7') {
        column.subType = 'moderator';
        column.inputType = 'string';
      } else if (column.id === '3' || column.id === '5') {
        column.subType = 'calculator';
        column.inputType = 'number';
      } else if (column.id === '4' || column.id === '6') {
        column.subType = 'calculatorN';
        column.inputType = 'number';
      } else { column.subType = 'result'; }
    }
  });
  return columnsClone;
};

const linkCalculators = (cols) => {
  const columnsClone = [...cols];
  columnsClone.forEach((col) => {
    if (col.id === '3') {
      col.linkedN = '4';
    }
    if (col.id === '5') {
      col.linkedN = '6';
    }
  });
  return columnsClone;
};

// Temporary assignment of visibility status
const assignVisibility = (cols) => {
  const columnsClone = [...cols];
  columnsClone.forEach((col) => {
    if (col.visibility === undefined) {
      col.visibility = true;
    }
  });
  return columnsClone;
};

// Order columns by their subtype
const reorderColumnsBySubtype = (cols) => {
  const columnsClone = [...cols];
  const pspecCols = [];
  const modCols = [];
  const calcCols = [];
  const dataCols = [];
  columnsClone.forEach((column) => {
    if (column.subType === 'pspecific') {
      pspecCols.push(column);
    } else if (column.subType === 'moderator') {
      modCols.push(column);
    } else if (column.subType === 'calculator' || column.subType === 'calculatorN') {
      calcCols.push(column);
    } else if (column.subType === 'result') {
      dataCols.push(column);
    }
  });
  const orderedCols = pspecCols.concat(modCols.concat(calcCols.concat(dataCols)));
  return orderedCols;
};

function modifyColumns(cols) {
  return assignVisibility(reorderColumnsBySubtype(linkCalculators(assignSubType(cols))));
}

export default modifyColumns;
