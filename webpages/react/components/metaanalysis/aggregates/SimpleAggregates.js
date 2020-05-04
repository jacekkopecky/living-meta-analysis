import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

function SimpleAggregates(props) {
  const { aggregates } = props;
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
          { aggregates.map((aggr) => {
            const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers);
            return (
              <tr>
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
