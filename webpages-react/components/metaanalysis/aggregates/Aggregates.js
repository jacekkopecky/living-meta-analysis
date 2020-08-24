import React, { useState } from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';
import formulas from './Formulas';
import './Aggregates.css';

function SimpleDisplay(props) {
  const { aggregates, clickable, makeClickable } = props;
  return (
    <SimpleAggregates
      aggregates={aggregates}
      clickable={clickable}
      makeClickable={makeClickable}
    />
  );
}

function ModeratorDisplay(props) {
  const {
    groupingAggregates, groups, groupingColumn, clickable, makeClickable, moderatorsWithGroups,
  } = props;

  if (groupingColumn) {
    return (
      <GroupingAggregates
        groupingAggregates={groupingAggregates}
        groups={groups}
        groupingColumn={groupingColumn}
        clickable={clickable}
        makeClickable={makeClickable}
        moderatorsWithGroups={moderatorsWithGroups}
      />
    );
  }
}

function Aggregates(props) {
  const {
    aggregates,
    groupingAggregates,
    groups,
    groupingColumn,
    clickable,
    makeClickable,
    moderatorsWithGroups,
  } = props;
  const [analysisType, setAnalysisType] = useState('simple');
  const formulaFunctions = formulas();
  const simpleFormulas = formulaFunctions.simpleFormulas;
  const moderatorFormulas = formulaFunctions.moderatorFormulas;
  console.log(simpleFormulas, moderatorFormulas);
  let content = null;

  function setSimple() {
    setAnalysisType('simple');
  }

  function setModerator() {
    setAnalysisType('moderator');
  }

  if (analysisType === 'simple') {
    content = (
      <SimpleDisplay
        aggregates={aggregates}
        clickable={clickable}
        makeClickable={makeClickable}
      />
    );
  } else if (analysisType === 'moderator') {
    content = (
      <ModeratorDisplay
        groupingAggregates={groupingAggregates}
        groups={groups}
        groupingColumn={groupingColumn}
        clickable={clickable}
        makeClickable={makeClickable}
        moderatorsWithGroups={moderatorsWithGroups}
      />
    );
  }
  return (
    <>
      <section className="aggregates">
        <div role="button" tabIndex={0} className={(analysisType === 'simple') ? 'analysisButton active' : 'analysisButton'} onClick={setSimple} onKeyDown={setSimple}>
          Simple analysis
        </div>
        <div role="button" tabIndex={0} className={(analysisType === 'moderator') ? 'analysisButton active' : 'analysisButton'} onClick={setModerator} onKeyDown={setModerator}>
          Moderator analysis
        </div>
        { content }
      </section>
    </>
  );
}

export default Aggregates;
