/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';


function Cell(props) {
  const {
    col, exp, displayedCell, toggleDisplay, ids,
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
    <td className={`${className}${ids === displayedCell.ids ? ' active' : ''}`} key={col.id} onClick={() => toggleDisplay(ids, details)}>
      {value}
    </td>

  );
}

export default Cell;
