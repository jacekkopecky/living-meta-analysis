import React from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';

const aggregateDetails = (aggr) => (
  <>
    <p>{ aggr.title }</p>
    <p>{ aggr.fullLabel }</p>
  </>
);

const aggregateValDetails = (aggr, value, group) => (
  <>
    <p>{ value }</p>
    <p>
      Calculated for the
      { ' ' }
      { group }
      { ' ' }
      group as
      { ' ' }
      { aggr.fullLabel }
    </p>
  </>
);

function GroupingAggregates(props) {
  const {
    groupingAggregates, makeClickable, mwgState,
  } = props;
  console.log(groupingAggregates);
  const [moderatorsWithGroups] = mwgState;
  return (
    <>
      <div id="modAnalysisTableContainer">
        <table id="modAnalysisTable">
          <thead>
            <tr>
              <th className="modAnalysisHead">Moderator:</th>
              { moderatorsWithGroups.map((moderator) => {
                if (moderator.included) {
                  let count = 0;
                  for (let i = 0; i < moderator.groups.length; i += 1) {
                    if (moderator.groups[i].included) {
                      count += 1;
                    }
                  }
                  if (count !== 0) {
                    return (
                      <th
                        key={moderator.moderatorObj.title}
                        colSpan={count}
                        className="modAnalysisHead"
                      >
                        { moderator.moderatorObj.title }
                      </th>
                    );
                  }
                }
                return null;
              }) }
            </tr>
          </thead>
          <thead>
            <tr>
              <th className="modAnalysisHead">Group:</th>
              { moderatorsWithGroups.map((moderator) => (moderator.included
                ? moderator.groups.map((group) => (group.included
                  ? (
                    <th key={group.group} className="modAnalysisHead">
                      { group.group }
                    </th>
                  )
                  : null
                ))
                : null)) }
            </tr>
          </thead>
          <tbody>
            { groupingAggregates.map((aggr) => (
              <tr key={aggr.fullLabel}>
                <td {...makeClickable(aggr.fullLabel, aggregateDetails(aggr))}>
                  { aggr.title || aggr.fullLabel }
                </td>
                { moderatorsWithGroups.map((moderator) => (moderator.included
                  ? moderator.groups.map((group) => {
                    if (group.included) {
                      const value = getAggregateDatumValue(
                        aggr, aggr.metaanalysis.papers, group.group, moderator.moderatorObj,
                      );
                      const padding = Math.trunc(value).toString().length;
                      return (
                        <td
                          key={aggr.title + group.group}
                          style={{ paddingRight: `${padding}ch` }}
                          {...makeClickable(
                            aggr.title + group.group,
                            aggregateValDetails(aggr, value, group.group),
                            true,
                          )}
                        >
                          { formatNumber(value) }
                        </td>
                      );
                    }
                    return null;
                  })
                  : null
                )) }
              </tr>
            )) }
          </tbody>
        </table>
      </div>
    </>
  );
}

export default GroupingAggregates;
