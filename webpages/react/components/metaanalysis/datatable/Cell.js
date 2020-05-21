/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';


function Cell(props) {
  const {
    col, exp, displayedCell, toggleDisplay, cellId,
  } = props;
  let value = getDatumValue(col, exp);
  let className = '';
  const details = (
    <>
      <p>
        Col value:
        {col.formula || value}
      </p>
      <p>
        Entered by:
        {exp.enteredBy}
      </p>
      <p>
        Creation time:
        {exp.ctime}
      </p>
    </>
  );

  if (col.id) {
    className += 'data';
  } else {
    value = formatNumber(value);
    className += 'computed';
  }
  return (
    <td className={`${className}${cellId === displayedCell.cellId ? ' active' : ''}`} key={col.id} onClick={() => toggleDisplay(cellId, details)}>
      {value}
    </td>

  );
}

function shouldMemo(prev, next) {
  if ((prev.displayedCell.cellId === next.cellId) || (next.displayedCell.cellId === prev.cellId)) {
    return false;
  }
  return true;
}
// We'll re-render the Cell only when we detect a change (cell color)
export default React.memo(Cell, shouldMemo);
