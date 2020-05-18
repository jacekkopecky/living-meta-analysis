import React, { useState } from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';
import Details from '../Details';


function Cell(props) {
  const { col, exp, } = props;
  const [display, setDisplay] = useState(props.display);

  const toggleDisplay = () => {
    setDisplay(!display);
    console.log('display set');
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
    <td className={className} key={col.id} onClick={toggleDisplay}>
      {value}
      {display && (
        <Details>
          Entered by:
          {exp.enteredBy}
          <br />
          Creation time:
          {exp.ctime}
        </Details>
      )}
    </td>
  );
}

export default Cell;
