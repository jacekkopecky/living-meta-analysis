let xCoord;
let originalColumn;

function dragOverListener(event) {
  const hoveredColumn = event.currentTarget;
  if (xCoord > event.pageX && hoveredColumn !== originalColumn && !hoveredColumn.classList.contains('colRearrangeLeft')) {
    hoveredColumn.classList.add('colRearrangeLeft');
  }
  if (xCoord < event.pageX && hoveredColumn !== originalColumn && !hoveredColumn.classList.contains('colRearrangeRight')) {
    hoveredColumn.classList.add('colRearrangeRight');
  }
}

function dragLeaveListener(event) {
  if (event.currentTarget.classList.contains('colRearrangeLeft')) {
    event.currentTarget.classList.remove('colRearrangeLeft');
  }
  if (event.currentTarget.classList.contains('colRearrangeRight')) {
    event.currentTarget.classList.remove('colRearrangeRight');
  }
}

function RearrangeColumn(e, columns, setColumns, moveCols, setMoveCols) {
  xCoord = e.pageX;

  function clearUp(nodeList) {
    for (const node of nodeList) {
      node.removeEventListener('dragleave', dragLeaveListener);
      node.removeEventListener('dragover', dragOverListener);
      if (node.classList.contains('colRearrangeLeft')) {
        node.classList.remove('colRearrangeLeft');
      }
      if (node.classList.contains('colRearrangeRight')) {
        node.classList.remove('colRearrangeRight');
      }
    }
  }

  function handleDragStart() {
    let columnDomElem;
    if (e.target.nodeName === 'BUTTON') {
      columnDomElem = e.target.parentNode;
    } else {
      columnDomElem = e.target.parentNode.parentNode;
    }
    originalColumn = columnDomElem;
    const columnType = columnDomElem.getAttribute('columntype');
    const columnId = columnDomElem.getAttribute('columnid');
    const columnTypeGroup = columns.filter((col) => col.subType === columnType);
    let columnBeingMoved;
    if (columnType !== 'result') {
      columnBeingMoved = columns.filter((col) => col.id === columnId)[0];
    } else {
      columnBeingMoved = columns.filter((col) => col.number === columnId)[0];
    }

    const allColumnDomElems = columnDomElem.parentNode.children;
    const columnDomElemTypeGroup = [];
    for (const column of allColumnDomElems) {
      const type = column.getAttribute('columntype');
      if (type && type === columnType) {
        columnDomElemTypeGroup.push(column);
      }
    }

    for (const column of columnDomElemTypeGroup) {
      column.addEventListener('dragleave', dragLeaveListener);
      column.addEventListener('dragover', dragOverListener);
    }

    return {
      col: [columnBeingMoved, columnDomElem],
      colGroup: [columnTypeGroup, columnDomElemTypeGroup],
    };
  }

  function handleDragEnd() {
    const [x, y] = [e.clientX, e.clientY];

    const dropElem = document.elementFromPoint(x, y);

    const columnElems = moveCols.colGroup[1];

    clearUp(columnElems);

    if (moveCols.colGroup[1].includes(dropElem) && dropElem !== moveCols.col[1]) {
      const dropIndex = moveCols.colGroup[1].indexOf(dropElem);
      const elemIndex = moveCols.colGroup[1].indexOf(moveCols.col[1]);
      const modGroup = columns.filter((col) => col.subType === 'moderator');
      const calcGroup = columns.filter((col) => col.subType === 'calculator');
      const resGroup = columns.filter((col) => col.subType === 'result');

      if (elemIndex !== undefined && dropIndex !== undefined) {
        let retVal;
        const tempColGroup = [...moveCols.colGroup[0]];

        if (elemIndex > dropIndex) {
          tempColGroup.splice(elemIndex, 1);
          tempColGroup.splice(dropIndex, 0, moveCols.col[0]);
          switch (moveCols.col[0].subType) {
          case 'moderator':
            retVal = tempColGroup.concat(calcGroup.concat(resGroup));
            break;
          case 'calculator':
            retVal = modGroup.concat(tempColGroup.concat(resGroup));
            break;
          case 'result':
            retVal = modGroup.concat(calcGroup.concat(tempColGroup));
            break;
          default:
            retVal = columns;
          }
        } else if (elemIndex < dropIndex) {
          tempColGroup.splice(elemIndex, 1);
          tempColGroup.splice(dropIndex + 1, 0, moveCols.col[0]);
          switch (moveCols.col[0].subType) {
          case 'moderator':
            retVal = tempColGroup.concat(calcGroup.concat(resGroup));
            break;
          case 'calculator':
            retVal = modGroup.concat(tempColGroup.concat(resGroup));
            break;
          case 'result':
            retVal = modGroup.concat(calcGroup.concat(tempColGroup));
            break;
          default:
            retVal = columns;
          }
        }
        return retVal;
      }
    }
    return columns;
  }

  if (e.type === 'dragstart') { setMoveCols(handleDragStart()); }
  if (e.type === 'dragend') {
    setColumns(handleDragEnd());
  }
}

export default RearrangeColumn;
