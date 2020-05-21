import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

function SimpleAggregates(props) {
  const { aggregates, toggleDisplay } = props;
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Aggregates</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {aggregates.map((aggr) => {
            const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers);
            const id = 0; // TODO: find a way to identify an aggr
            const details = (
              <>
                <p>{value}</p>
                <p>{aggr.title}</p>
                <p>{aggr.formula}</p>
              </>
            );
            return (
              <tr key={aggr.formula} onClick={() => toggleDisplay(id, details)}>
                <td>{aggr.title}</td>
                <td>{formatNumber(value)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default SimpleAggregates;
