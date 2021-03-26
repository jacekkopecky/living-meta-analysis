import React from 'react';
import { getDatumValue, formatNumber, formatDateTimeSplit } from '../../../tools/datatools';
import Editable from '../Editable';

function addCellDetails(enteredBy, ctime, paper, cval, ...args) {
  const fullLabel = args;
  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>
              Cell value:
              { ' ' }
            </td>
            <td>
              { (parseInt(cval, 10) && cval.length > 10) ? parseInt(cval, 10).toFixed(10) : cval }
            </td>
          </tr>
          <tr>
            <td>
              Paper:
              { ' ' }
            </td>
            <td>
              { paper.title }
            </td>
          </tr>
          <tr>
            <td>
              Entered by:
              { ' ' }
            </td>
            <td>
              { enteredBy }
              { ' ' }
              at
              { ' ' }
              { formatDateTimeSplit(ctime).time }
              { ' ' }
              on
              { ' ' }
              { formatDateTimeSplit(ctime).date }
            </td>
          </tr>
          fullLabel
          ? (
          <tr>
            <td>
              Calculated as:
              { ' ' }
            </td>
            <td>
              { fullLabel }
            </td>
          </tr>
          )
          : ``
        </tbody>
      </table>
    </>
  );
}

const dataCellDetails = ({ enteredBy, ctime, paper }, cval) => (
  addCellDetails( enteredBy, ctime, paper, cval)
);
const computedCellDetails = ({ fullLabel }, { enteredBy, ctime, paper }, cval) => (
  addCellDetails(enteredBy, ctime, paper, cval, fullLabel)
);

export default function Cell(props) {
  const {
    col, exp, cellId, makeClickable, editCell,
  } = props;
  const value = (getDatumValue(col, exp) || null);
  const padding = Math.trunc(value).toString().length;
  /* Reminder: some parts of the Cell object are initialized in 'makeClickable' function,
  found in Metaanalysis.js */

  if (col.visibility === false) {
    return (
      <td />
    );
  }

  return (
    col.id
    // data cell
      ? (
        <td {...makeClickable(cellId, dataCellDetails(exp, value))}>
          <Editable cellId={cellId} type="input" onSave={editCell}>{ value }</Editable>
        </td>
      )
      // computed cell
      : (
        <td
          style={{ paddingRight: `${padding}ch` }}
          {...makeClickable(cellId, computedCellDetails(col, exp, value), 'computed')}
        >
          { formatNumber(value) }
        </td>
      )
  );
}