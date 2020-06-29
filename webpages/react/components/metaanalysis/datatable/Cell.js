import React from 'react';
import { getDatumValue, formatNumber, formatDateTime } from '../../../tools/datatools';
import Editable from '../Editable';

const dataCellDetails = ({ enteredBy, ctime }) => (
  <>
    <p>
      Entered by:
      { enteredBy }
    </p>
    <p>
      Creation time:
      { formatDateTime(ctime) }
    </p>
  </>
);
const computedCellDetails = ({ fullLabel }, value) => (
  <>
    <p>
      { value }
    </p>
    <p>
      Calculated as { fullLabel }
    </p>
  </>
);

export default function Cell(props) {
  const {
    col, exp, cellId, makeClickable, editCell,
  } = props;
  // const edit = useContext(EditContext);
  const value = getDatumValue(col, exp);
  const padding = Math.trunc(value).toString().length;
  return (
    col.id
      ? (
        <td {...makeClickable(cellId, dataCellDetails(exp))}>
          <Editable cellId={cellId} type="input" onSave={editCell}>{ value }</Editable>
        </td>
      )
      : (
        <td
          style={{ paddingRight: `${padding}ch` }}
          {...makeClickable(cellId, computedCellDetails(col, value), true)}
        >
          { formatNumber(value) }
        </td>
      )
  );
}

// function shouldMemo(prev, next) {
//   return prev.cellId === next.cellId
//     && next.makeClickable(prev.cellId).className === prev.makeClickable(prev.cellId).className
//     && prev.edit === next.edit;
// }

// We'll re-render the Cell only when we detect a change (cell color)
// export default React.memo(Cell, shouldMemo);
