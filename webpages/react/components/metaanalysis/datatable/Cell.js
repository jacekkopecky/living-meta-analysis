import React from 'react';
import { getDatumValue, formatNumber, formatDateTime } from '../../../tools/datatools';

const dataCellDetails = ({ enteredBy, ctime }) => (
  <>
    <p>
      Entered by:
      {enteredBy}
    </p>
    <p>
      Creation time:
      {formatDateTime(ctime)}
    </p>
  </>
);
const computedCellDetails = ({ fullLabel }, value) => (
  <>
    <p>
      {value}
    </p>
    <p>
      Calculated as {fullLabel}
    </p>
  </>
);

function Cell(props) {
  const {
    col, exp, cellId, makeClickable,
  } = props;
  const value = getDatumValue(col, exp);
  const padding = Math.trunc(value).toString().length;
  return (
    col.id
      ? (
        <td {...makeClickable(cellId, dataCellDetails(exp))}>
          {value}
        </td>
      )
      : (
        <td
          style={{ paddingRight: `${padding}ch` }}
          {...makeClickable(cellId, computedCellDetails(col, value), true)}
        >
          { formatNumber(value)}
        </td>
      )
  );
}

function shouldMemo(prev, next) {
  if ((next.makeClickable(prev.cellId).className === 'active' && prev.makeClickable(prev.cellId).className === '')
    || (next.makeClickable(prev.cellId).className === '' && prev.makeClickable(prev.cellId).className === 'active')) {
    return false;
  }
  return true;
}
// We'll re-render the Cell only when we detect a change (cell color)
export default React.memo(Cell, shouldMemo);
