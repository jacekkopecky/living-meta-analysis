// Function fires when user drags/drops a grabber icon in edit mode

function RearrangeRow(props, parentOfRows, e) {
  const [rowEvent, setRowEvent] = props;

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
    let thisElement;
    if (e.target.nodeName === 'BUTTON') {
      thisElement = e.target;
    } else {
      thisElement = e.target.parentNode;
    }

    const relatedRow = thisElement.parentNode.parentNode;
    const rowsToMove = getRelatedRows(relatedRow);
    const rowIndex = Array.prototype.indexOf.call(parentOfRows.current.children, relatedRow);

    console.log(rowIndex);
    return { rows: rowsToMove, topRowIndex: rowIndex };
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
    const rowsToSwap = getRelatedRows(topRow);
    const rowIndex = Array.prototype.indexOf.call(parentOfRows.current.children, topRow);
    console.log(rowIndex);
  }

  if (e.type === 'dragstart') { setRowEvent(handleDragStart()); }
  if (e.type === 'dragend') { handleDragEnd(rowEvent); }
}

export default RearrangeRow;
