/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';


function Cell(props) {
  const {
    col, exp, displayedCell, setDisplayedCell, ids,
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
  const toggleVisible = () => {
    if (ids !== displayedCell.ids) {
      setDisplayedCell({ text: details, ids });
    } else {
      setDisplayedCell({ text: null, ids: null });
    }
  };

  if (col.id) {
    className += 'data';
  } else {
    value = formatNumber(value);
    className += 'computed';
  }
  return (
    <>
      <td className={`${className}${ids === displayedCell.ids ? ' active' : ''}`} key={col.id} onClick={toggleVisible}>
        {value}
      </td>
      {/* {displayedCell === ids && (
        <Details setDisplayedCell={setDisplayedCell}>
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
        </Details>
      )} */}
    </>
  );
}

export default Cell;
