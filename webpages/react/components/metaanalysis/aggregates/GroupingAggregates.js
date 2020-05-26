import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

function GroupingAggregates(props) {
  const {
    groupingAggregates, groups, groupingColumn, clickable,
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
              <clickable.type
                {...clickable.props}
                key={aggr.title}
                cellId={aggr.title}
                cellContent={(
                  <td>{aggr.title}</td>
                )}
                cellDetails={(
                  <>
                    <p>{aggr.title}</p>
                    <p>
                      {aggr.fullLabel}
                    </p>
                  </>
                )}
              />
              {groups.map((group) => {
                const value = getAggregateDatumValue(aggr, aggr.metaanalysis.papers, group);
                return (
                  <clickable.type
                    {...clickable.props}
                    key={group}
                    cellId={group}
                    cellContent={(
                      <td>{formatNumber(value)}</td>
                    )}
                    cellDetails={(
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
                    )}
                  />
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
