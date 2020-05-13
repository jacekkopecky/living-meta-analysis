import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

function GroupingAggregates(props) {
  const { groupingAggregates, groups, groupingColumn } = props;
  return (
    <>
      <h3>
        Grouping aggregates by
        {' '}
        {groupingColumn}
      </h3>
      <table>
        <thead>
          <tr>
            <th>Aggregates</th>
            {groups.map((group) => (
              <th key={group}>{group}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupingAggregates.map((aggr) => (
            <tr key={aggr.formula}>
              <td>{aggr.title}</td>

              {groups.map((group) => {
                const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers, group);
                return (
                  <td key={group}>{formatNumber(value)}</td>
                );
              })}

            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default GroupingAggregates;
