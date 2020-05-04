import React from 'react';
import { getAggregateDatumValue } from '../../../tools/datatools';

function Aggregates(props) {
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
          {aggregates.map((aggr) => {
            const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers);
            return (
              <tr>
                <td>{aggr.title}</td>
                <td>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default Aggregates;
