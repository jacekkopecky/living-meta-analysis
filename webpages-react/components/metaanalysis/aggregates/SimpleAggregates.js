import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';
import './SimpleAggregates.css';

const simpleAggregateDetails = (aggr, value) => (
  <>
    <p>{ value }</p>
    <p>{ aggr.title }</p>
    <p>{ aggr.fullLabel }</p>
  </>
);

function shouldMemo(prev, next) {
  if ((next.makeClickable(prev.aggr.fullLabel).className === 'active' && prev.makeClickable(prev.aggr.fullLabel).className === '')
  || (next.makeClickable(prev.aggr.fullLabel).className === '' && prev.makeClickable(prev.aggr.fullLabel).className === 'active')) {
    return false;
  }
  return true;
}

const AggregateCell = React.memo((props) => {
  const { aggr, makeClickable } = props;
  const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers);
  const padding = Math.trunc(value).toString().length;
  return (
    <tr {...makeClickable(aggr.fullLabel, simpleAggregateDetails(aggr, value))}>
      <td>{ aggr.title || aggr.fullLabel }:</td>
      <td className="computed" style={{ paddingRight: `${padding}ch` }}>{ formatNumber(value) }</td>
    </tr>
  );
}, shouldMemo);

function SimpleAggregates(props) {
  const { aggregates, makeClickable } = props;
  return (
    <div className="simpleaggregates">
      <table>
        <thead>
          <tr>
            <th>Simple analysis definition</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          { aggregates.map((aggr) => (
            <AggregateCell key={aggr.fullLabel} aggr={aggr} makeClickable={makeClickable} />
          )) }
        </tbody>
      </table>
    </div>
  );
}

export default SimpleAggregates;
