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
    groupingAggregates, groups, groupingColumn, makeClickable, moderatorsWithGroups,
  } = props;
  moderatorsWithGroups.sort((a, b) => {
    if (a.groups.length < b.groups.length) {
      return -1;
    }
    if (a.groups.length > b.groups.length) {
      return 1;
    }
    return 0;
  });
  return (
    <>
      <div id="modAnalysisTableContainer">
        <table id="modAnalysisTable">
          <thead>
            <tr>
              <th className="modAnalysisHead" />
              { moderatorsWithGroups.map((moderator) => (moderator.included
                ? (
                  <th
                    key={moderator.moderatorObj.title}
                    colSpan={moderator.groups.length}
                    className="modAnalysisHead"
                  >
                    { moderator.moderatorObj.title }
                  </th>
                )
                : null)) }
            </tr>
          </thead>
          <thead>
            <tr>
              <th className="modAnalysisHead" />
              { moderatorsWithGroups.map((moderator) => (moderator.included
                ? moderator.groups.map((group) => (
                  <th key={group} className="modAnalysisHead">
                    { group }
                  </th>
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
                    const value = getAggregateDatumValue(
                      aggr, aggr.metaanalysis.papers, group, moderator.moderatorObj,
                    );
                    const padding = Math.trunc(value).toString().length;
                    return (
                      <td
                        key={aggr.title + group}
                        style={{ paddingRight: `${padding}ch` }}
                        {...makeClickable(
                          aggr.title + group,
                          aggregateValDetails(aggr, value, group),
                          true,
                        )}
                      >
                        { formatNumber(value) }
                      </td>
                    );
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
