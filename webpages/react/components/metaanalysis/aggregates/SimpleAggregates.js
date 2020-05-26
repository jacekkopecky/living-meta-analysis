import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

function SimpleAggregates(props) {
  const { aggregates, clickable } = props;
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
            return (
              <clickable.type
                {...clickable.props}
                key={aggr.title}
                cellId={aggr.title}
                cellContent={(
                  <tr>
                    <td>{aggr.title}</td>
                    <td>{formatNumber(value)}</td>
                  </tr>
                )}
                cellDetails={(
                  <>
                    <p>{value}</p>
                    <p>{aggr.title}</p>
                    <p>{aggr.fullLabel}</p>
                  </>
                )}
              />
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default SimpleAggregates;
