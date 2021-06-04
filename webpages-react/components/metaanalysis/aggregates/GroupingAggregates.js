import React, { useState, useContext } from 'react';
import { getAggregateDatumValue, formatNumber } from '../../../tools/datatools';
import { RemovalPopup } from '../Popup';
import EditContext from '../EditContext';

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
    groupingAggregatesState, makeClickable, mwgState,
  } = props;
  const [groupingAggregates, setGroupingAggregates] = groupingAggregatesState;
  const [moderatorsWithGroups] = mwgState;
  const [popupStatus, setPopupStatus] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const edit = useContext(EditContext);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function selectAnalysis(e) {
    const analysisFormula = e.currentTarget.getAttribute('analysisformula');
    const analysisToSelect = groupingAggregates.filter(
      (aggr) => aggr.formula === analysisFormula,
    )[0];
    setSelectedAnalysis(analysisToSelect);
  }

  function removeModAnalysis() {
    const analysisClone = [...groupingAggregates];
    analysisClone.splice(analysisClone.indexOf(selectedAnalysis), 1);
    setGroupingAggregates(analysisClone);
  }

  return (
    <>
      <div id="modAnalysisTableContainer">
        <table id="modAnalysisTable">
          <thead>
            <tr>
              <th className={edit.flag ? 'modAnalysisHead editMode primary' : 'modAnalysisHead'}>Moderator:</th>
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
                        className={edit.flag ? 'modAnalysisHead editMode primary' : 'modAnalysisHead'}
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
              <th className={edit.flag ? 'modAnalysisHead editMode primary' : 'modAnalysisHead'}>Group:</th>
              { moderatorsWithGroups.map((moderator) => (moderator.included
                ? moderator.groups.map((group) => (group.included
                  ? (
                    <th key={group.group} className={edit.flag ? 'modAnalysisHead editMode primary' : 'modAnalysisHead'}>
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
                  <div>
                    { aggr.title || aggr.fullLabel }
                  </div>
                  { edit.flag
                    ? (
                      <div>
                        <div className="removeModAnalysisButton" analysisformula={aggr.formula} role="button" tabIndex={0} onClick={(e) => { popupToggle(); selectAnalysis(e); }} onKeyDown={popupToggle}>Remove</div>
                        { popupStatus
                          ? (
                            <RemovalPopup
                              closingFunc={popupToggle}
                              removalFunc={removeModAnalysis}
                              removalText={`paper: ${selectedAnalysis.title}`}
                            />
                          )
                          : null }
                      </div>
                    )
                    : null }
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
