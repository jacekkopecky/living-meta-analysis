import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';

function Cell(props) {
  const {
    col, exp, cellId, Clickable,
  } = props;
  const value = getDatumValue(col, exp);

  let details;
  if (col.id) {
    details = (
      <Clickable.type
        {...Clickable.props}
        cellId={cellId}
        cellContent={<td>{value}</td>}
        cellDetails={(
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
        )}
      />
    );
  } else {
    details = (
      <Clickable.type
        {...Clickable.props}
        cellId={cellId}
        cellContent={<td>{formatNumber(value)}</td>}
        cellDetails={(
          <>
            <p>
              {value}
            </p>
            <p>
              Calculated as
              {' '}
              {col.fullLabel}
            </p>
          </>
        )}
      />
    );
  }
  return details;
}

function shouldMemo(prev, next) {
  const oldDisplayedCell = prev.Clickable.props.displayedCell;
  const newDisplayedCell = next.Clickable.props.displayedCell;
  if ((oldDisplayedCell.cellId === next.cellId) || (newDisplayedCell.cellId === prev.cellId)) {
    return false;
  }
  return true;
}
// We'll re-render the Cell only when we detect a change (cell color)
export default React.memo(Cell, shouldMemo);
