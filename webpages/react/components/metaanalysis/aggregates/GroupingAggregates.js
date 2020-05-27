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
                const padding = Math.trunc(value).toString().length;
                return (
                  <td
                    style={{ paddingRight: `${padding}ch` }}
                    {...makeClickable(
                      aggr.title + group,
                      aggregateValDetails(aggr, value, group),
                      true,
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
