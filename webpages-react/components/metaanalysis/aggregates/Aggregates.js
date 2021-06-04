import React, { useState } from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';
import AddSimpleAnalysis from './AddSimpleAnalysis';
import AddModeratorAnalysis from './AddModeratorAnalysis';
import FilterModerators from './FilterModerators';
import formulas from './Formulas';
import './Aggregates.css';

function SimpleDisplay(props) {
  const {
    aggregatesState, clickable, makeClickable, formulaFunctions, columns,
  } = props;
  return (
    <SimpleAggregates
      aggregatesState={aggregatesState}
      clickable={clickable}
      makeClickable={makeClickable}
      formulaFunctions={formulaFunctions}
      columns={columns}
    />
  );
}

function ModeratorDisplay(props) {
  const {
    groupingAggregates,
    clickable,
    makeClickable,
    mwgState,
    formulaFunctions,
  } = props;

  return (
    <GroupingAggregates
      groupingAggregatesState={groupingAggregates}
      clickable={clickable}
      makeClickable={makeClickable}
      mwgState={mwgState}
      formulaFunctions={formulaFunctions}
    />
  );
}

function Aggregates(props) {
  const {
    aggregatesState,
    groupingAggregatesState,
    clickable,
    makeClickable,
    moderatorsWithGroups,
    columns,
    metaanalysis,
  } = props;
  const [aggregates, setAggregates] = aggregatesState;
  const [groupingAggregates, setGroupingAggregates] = groupingAggregatesState;
  const [analysisType, setAnalysisType] = useState('simple');
  const mwgState = useState(moderatorsWithGroups);
  const formulaFunctions = formulas().moderatorFormulas;
  let content;

  function setSimple() {
    setAnalysisType('simple');
  }

  function setModerator() {
    setAnalysisType('moderator');
  }

  if (analysisType === 'simple') {
    content = (
      <>
        <AddSimpleAnalysis
          formulaFunctions={formulaFunctions}
          columns={columns}
          aggregatesState={[aggregates, setAggregates]}
          metaanalysis={metaanalysis}
        />
        <SimpleDisplay
          aggregatesState={[aggregates, setAggregates]}
          clickable={clickable}
          makeClickable={makeClickable}
          formulaFunctions={formulaFunctions}
          columns={columns}
        />
      </>
    );
  } else if (analysisType === 'moderator') {
    content = (
      <>
        <AddModeratorAnalysis
          formulaFunctions={formulaFunctions}
          columns={columns}
          aggregatesState={[groupingAggregates, setGroupingAggregates]}
          metaanalysis={metaanalysis}
        />
        <FilterModerators mwgState={mwgState} />
        <ModeratorDisplay
          groupingAggregates={[groupingAggregates, setGroupingAggregates]}
          clickable={clickable}
          makeClickable={makeClickable}
          mwgState={mwgState}
          formulaFunctions={formulaFunctions}
        />
      </>
    );
  }
  return (
    <>
      <section className="aggregates">
        <div>
          <div role="button" tabIndex={0} className={(analysisType === 'simple') ? 'analysisButton active' : 'analysisButton'} onClick={setSimple} onKeyDown={setSimple}>
            Simple analysis
          </div>
          <div role="button" tabIndex={0} className={(analysisType === 'moderator') ? 'analysisButton active' : 'analysisButton'} onClick={setModerator} onKeyDown={setModerator}>
            Moderator analysis
          </div>
        </div>
        { content }
      </section>
    </>
  );
}

export default Aggregates;
