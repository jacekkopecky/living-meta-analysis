import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

const aggregateDetails = (aggr) => (
  <>
    <p>{aggr.title}</p>
    <p>{aggr.fullLabel}</p>
  </>
);

const aggregateValDetails = (aggr, value, group) => (
  <>
    <p>{value}</p>
    <p>
      Calculated for the
      {' '}
      {group}
      {' '}
      group as
      {' '}
      {aggr.fullLabel}
    </p>
  </>
);

function GroupingAggregates(props) {
  const {
    groupingAggregates, groups, groupingColumn, makeClickable,
  } = props;
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
              <td {...makeClickable(aggr.title, aggregateDetails(aggr))}>
                {aggr.title}
              </td>
              {groups.map((group) => {
                const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers, group);
                return (
                  <td
                    {...makeClickable(
                      aggr.title + group,
                      aggregateValDetails(aggr, group, value),
                    )}
                  >
                    {formatNumber(value)}
                  </td>
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
