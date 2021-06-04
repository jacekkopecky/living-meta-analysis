import React, { useState, useContext } from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';
import EditContext from '../EditContext';
import { RemovalPopup } from '../Popup';
import './SimpleAggregates.css';

// function SimpleAnalysisMenu(props) {
//   const {
//     selectedAnalysis,
//     aggregatesState,
//     formulaFunctions,
//     columns,
//     formulaStateObj,
//   } = props;
//   const [aggregates, setAggregates] = aggregatesState;
//   const [formulaState, setFormulaState] = formulaStateObj;
//   const analysisClone = { ...selectedAnalysis };
//   const numberColumns = columns.filter((col) => col.subtype !== 'moderator');
//   console.log(selectedAnalysis);
//
//   function handleFormulaChange(e) {
//     const formulaId = e.currentTarget.value;
//     let currentFormula = { ...selectedAnalysis };
//     for (let i = 0; i < formulaFunctions.length; i += 1) {
//       if (formulaFunctions[i].id === formulaId) {
//         currentFormula = formulaFunctions[i];
//       }
//     }
//     setFormulaState(currentFormula);
//   }
//
//   if (selectedAnalysis) {
//     return (
//       <>
//         <p>{ selectedAnalysis.fullLabel }</p>
//         <form>
//           <label htmlFor="titleInput">Title:
//             <input type="text" placeholder={selectedAnalysis.title} />
//           </label>
//           <label htmlFor="simpleInput">Select calculation formula:
//             <select name="simpleInput" onChange={handleFormulaChange}>
//               { formulaFunctions.map((formula) => (
//                 <option
//                   key={`simpleInput${formula.id}`}
//                   value={formula.id}
//                   selected={formula.id === analysisClone.formulaObj.id ? 'selected' : null}
//                 >
//                   { formula.label }
//                 </option>
//               )) }
//             </select>
//           </label>
//           { formulaState.parameters.map((param) => (
//             <label
//               htmlFor={`simpleInput${formulaState.id}${param}`}
//               key={`simpleInput${formulaState.id}${param}`}
//               className="paramSelect"
//             >
//               { param }:
//               <select name={`simpleInput${formulaState.id}${param}`}>
//                 { numberColumns.map((option) => (
//                   <option
//                     key={`simpleInput${analysisClone.formulaObj.id}
//                     ${param}${option.title || option.label}`}
//                     value={option.title || option.label}
//                   >
//                     { option.title || option.label }
//                   </option>
//                 )) }
//               </select>
//             </label>
//           )) }
//         </form>
//       </>
//     );
//   } else return null;
// }

const simpleAggregateDetails = (aggr, value) => (
  <>
    <p>{ value }</p>
    <p>{ aggr.title }</p>
    <p>{ aggr.fullLabel }</p>
  </>
);

// function shouldMemo(prev, next) {
//   if ((next.makeClickable(prev.aggr.fullLabel).className === 'active'
//   && prev.makeClickable(prev.aggr.fullLabel).className === '')
//   || (next.makeClickable(prev.aggr.fullLabel).className === ''
//   && prev.makeClickable(prev.aggr.fullLabel).className === 'active')) {
//     return false;
//   }
//   return true;
// }

const AggregateCell = (props) => {
  const {
    aggr, aggregatesState, makeClickable, edit,
  } = props;
  const [aggregates, setAggregates] = aggregatesState;
  const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers);
  const padding = Math.trunc(value).toString().length;
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function removeAnalysis() {
    const aggregatesClone = [...aggregates];
    const index = aggregatesClone.indexOf(aggr);
    aggregatesClone.splice(index, 1);
    setAggregates(aggregatesClone);
  }

  return (
    <tr {...makeClickable(aggr.fullLabel, simpleAggregateDetails(aggr, value), null, 'simpleTR')}>
      <td>{ aggr.title || aggr.fullLabel }:</td>
      <td className="computed" style={{ paddingRight: `${padding}ch` }}>
        { formatNumber(value) }
      </td>
      { edit.flag
        ? (
          <td>
            <div className="removeAnalysisButton" role="button" tabIndex={0} onClick={popupToggle} onKeyDown={popupToggle}>Remove</div>
            { popupStatus
              ? (
                <RemovalPopup
                  closingFunc={popupToggle}
                  removalFunc={removeAnalysis}
                  removalText={aggr.title}
                />
              )
              : null }
          </td>
        )
        : null }
    </tr>
  );
};

function SimpleAggregates(props) {
  const {
    aggregatesState,
    makeClickable,
  } = props;
  const [aggregates] = aggregatesState;
  const edit = useContext(EditContext);
  return (
    <div className="simpleaggregates">
      <table>
        <thead>
          <tr>
            <th className={edit.flag ? 'editMode primary' : null}>Simple analysis definition</th>
            <th className={edit.flag ? 'editMode primary' : null} colSpan={edit.flag ? 2 : 1}>Value</th>
          </tr>
        </thead>
        <tbody>
          { aggregates.map((aggr) => (
            <AggregateCell
              key={aggr.fullLabel}
              aggr={aggr}
              aggregatesState={aggregatesState}
              makeClickable={makeClickable}
              edit={edit}
            />
          )) }
        </tbody>
      </table>
    </div>
  );
}

export default SimpleAggregates;
