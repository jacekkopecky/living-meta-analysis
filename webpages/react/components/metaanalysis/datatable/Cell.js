import React, { useState } from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';
import Details from '../Details';


function Cell(props) {
  const {
    col, exp, displayedCell, setDisplayedCell, ids,
  } = props;

  const [display, setDisplay] = useState(false)
  const toggleVisible = () => {
    setDisplay(true);
    setDisplayedCell(ids);
    if (displayedCell === ids) {
      setDisplay(!display);
    }
  };

  let value = getDatumValue(col, exp);
  let className;
  if (col.id) {
    className = 'data';
  } else {
    value = formatNumber(value);
    className = 'computed';
  }
  return (
    <td className={className} key={col.id} onClick={toggleVisible}>
      {value}
      {display && displayedCell === ids && (
        <Details>
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
      )}
    </td>
  );
}

export default Cell;
