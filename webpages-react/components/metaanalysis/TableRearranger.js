// Function fires when user drags/drops a grabber icon in edit mode

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
    const yCoord = e.pageY;

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

    while (offset < yCoord && i < 1000) {
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
    tempPapers.splice(rowsToDrop.topRowIndex, 1);
    tempPapers.splice(k, 0, paperState[rowsToDrop.topRowIndex]);
    setPaperState(tempPapers);

    const tempPaperOrder = [...paperOrder];
    tempPaperOrder.splice(rowsToDrop.topRowIndex, 1);
    tempPaperOrder.splice(k, 0, paperOrder[rowsToDrop.topRowIndex]);
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

  function dragOverListener(event) {
    let elem = event.target;
    while (elem.nodeName !== 'TR') {
      elem = elem.parentNode;
    }
    while (!elem.nextSibling.classList.contains('paperstart')) {
      elem = elem.nextSibling;
    }
    elem.classList.add('tableRearrangeHover');
  }
  function dragLeaveListener(event) {
    let elem = event.target;
    while (elem.nodeName !== 'TR') {
      elem = elem.parentNode;
    }
    while (!elem.nextSibling.classList.contains('paperstart')) {
      elem = elem.nextSibling;
    }
    elem.classList.remove('tableRearrangeHover');
  }

  if (e.type === 'dragstart') { setRowEvent(handleDragStart()); }
  if (e.type === 'dragend') { handleDragEnd(rowEvent); }
}

export default RearrangeRow;
