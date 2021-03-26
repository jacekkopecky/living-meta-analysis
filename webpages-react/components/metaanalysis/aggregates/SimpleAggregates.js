import React, { useState, useContext } from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';
import EditContext from '../EditContext';
import { RemovalPopup } from '../Popup';
import './SimpleAggregates.css';

const simpleAggregateDetails = (aggr, value) => (
  <>
    <p>{ value }</p>
    <p>{ aggr.title }</p>
    <p>{ aggr.fullLabel }</p>
  </>
);

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
