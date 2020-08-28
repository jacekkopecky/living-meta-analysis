// Function fires when user drags/drops a grabber icon in edit mode
let yCoord;
let originalRow;

function dragOverListener(event) {
  let topElem = event.target;
  let bottomElem = event.target;
  while (topElem.nodeName !== 'TR') {
    topElem = topElem.parentNode;
  }
  while (bottomElem.nodeName !== 'TR') {
    bottomElem = bottomElem.parentNode;
  }
  while (!topElem.classList.contains('paperstart')) {
    topElem = topElem.previousSibling;
  }
  while (!bottomElem.nextSibling.classList.contains('paperstart')) {
    bottomElem = bottomElem.nextSibling;
  }
  if (yCoord > event.pageY && topElem !== originalRow) {
    topElem.classList.add('rowRearrangeAbove');
  } else if (yCoord < event.pageY && topElem !== originalRow) {
    bottomElem.classList.add('rowRearrangeBelow');
  }
}
function dragLeaveListener() {
  const rowsWithClass1 = document.querySelectorAll('.rowRearrangeAbove');
  const rowsWithClass2 = document.querySelectorAll('.rowRearrangeBelow');
  for (let i = 0; i < rowsWithClass1.length; i += 1) {
    rowsWithClass1[i].classList.remove('rowRearrangeAbove');
  }
  for (let i = 0; i < rowsWithClass2.length; i += 1) {
    rowsWithClass2[i].classList.remove('rowRearrangeBelow');
  }
}

function RearrangeRow(rowEvent, setRowEvent, parentOfRows, e, papers, paperOrderValue) {
  const [paperState, setPaperState] = papers;
  const [paperOrder, setPaperOrder] = paperOrderValue;
  /* Accepts the top row of all rows associated with a specific paper in the datatabble
  Returns all rows associated with the specific paper that the accepted row belongs to */
  function getRelatedRows(currentRow) {
    const relatedRows = [currentRow];
    while (!currentRow.nextSibling.classList.contains('paperstart')) {
      relatedRows.push(currentRow.nextSibling);
      currentRow = currentRow.nextSibling;
    }
    return relatedRows;
  }

  /* Fires on dragstart browser event
  Returns all rows associated with dragged row, index of top row */
  function handleDragStart() {
    yCoord = e.pageY;
    for (let j = 0; j < parentOfRows.current.children.length; j += 1) {
      const elem = parentOfRows.current.children[j];
      elem.addEventListener('dragover', dragOverListener);
      elem.addEventListener('dragleave', dragLeaveListener);
    }

    let thisElement;
    if (e.target.nodeName === 'BUTTON') {
      thisElement = e.target;
    } else {
      thisElement = e.target.parentNode;
    }

    const relatedRow = thisElement.parentNode.parentNode;
    originalRow = relatedRow;
    const rowsToMove = getRelatedRows(relatedRow);
    rowsToMove.forEach((element) => {
      element.classList.add('beingRearranged');
    });

    let k = 0;
    let currentElement = parentOfRows.current.children[0];
    while (currentElement !== relatedRow) {
      if (currentElement.classList.contains('paperstart')) {
        k += 1;
      }
      currentElement = currentElement.nextSibling;
    }

    return { rows: rowsToMove, topRowIndex: k };
  }

  function handleDragEnd(rowsToDrop) {
    const yDropCoord = e.pageY;

    function calcOffset(y1, y2) {
      return y2 - y1;
    }

    function getTopRow(elem, index) {
      while (!elem.classList.contains('paperstart')) {
        index -= 1;
        elem = elem.parentNode.childNodes[index];
      }
      return elem;
    }

    let i = 0;
    const bodyRect = document.body.getBoundingClientRect().top;
    let offset = calcOffset(
      bodyRect,
      parentOfRows.current.childNodes[i].getBoundingClientRect().top,
    );

    while (offset < yDropCoord && i < 1000) {
      offset = calcOffset(
        bodyRect,
        parentOfRows.current.childNodes[i].getBoundingClientRect().top,
      );
      i += 1;
    }

    const topRow = getTopRow(parentOfRows.current.childNodes[i], i);

    let k = 0;
    let thisElement = parentOfRows.current.children[0];
    while (topRow !== thisElement) {
      if (thisElement.classList.contains('paperstart')) {
        k += 1;
      }
      thisElement = thisElement.nextSibling;
    }

    const tempPapers = [...paperState];
    const tempPaperOrder = [...paperOrder];

    if (yCoord < yDropCoord) {
      tempPapers.splice(rowsToDrop.topRowIndex, 1);
      tempPapers.splice(k, 0, paperState[rowsToDrop.topRowIndex]);
      tempPaperOrder.splice(rowsToDrop.topRowIndex, 1);
      tempPaperOrder.splice(k, 0, paperOrder[rowsToDrop.topRowIndex]);
    }
    if (yCoord > yDropCoord) {
      tempPapers.splice(rowsToDrop.topRowIndex, 1);
      tempPapers.splice(k - 1, 0, paperState[rowsToDrop.topRowIndex]);
      tempPaperOrder.splice(rowsToDrop.topRowIndex, 1);
      tempPaperOrder.splice(k - 1, 0, paperOrder[rowsToDrop.topRowIndex]);
    }

    setPaperState(tempPapers);
    setPaperOrder(tempPaperOrder);

    rowsToDrop.rows.forEach((element) => {
      element.classList.remove('beingRearranged');
    });
    for (let j = 0; j < parentOfRows.current.children.length; j += 1) {
      const elem = parentOfRows.current.children[j];
      elem.removeEventListener('dragover', dragOverListener);
      elem.removeEventListener('dragleave', dragLeaveListener);
    }
    const finalHover = document.getElementsByClassName('tableRearrangeHover');
    if (finalHover[0]) {
      finalHover[0].classList.remove('tableRearrangeHover');
    }
  }

  if (e.type === 'dragstart') { setRowEvent(handleDragStart()); }
  if (e.type === 'dragend') { handleDragEnd(rowEvent); }
}

export default RearrangeRow;
