import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';
import math from './../../../../lib/math.min';

function Aggregates(props) {
  // we're importing the math library used in the orginal LiMA
  // we're putting it inside window so that formulas.js can use it (for the erf function)
  window.math = math;
  const {
    aggregates,
    groupingAggregates,
    groups,
    groupingColumn,
  } = props;
  return (
    <section>
      <SimpleAggregates aggregates={aggregates} /* groupingColumnsObjs={} */ />

      {/* TODO:  map on groupingColObj => multiple grouping aggregates */}
      <GroupingAggregates
        groupingAggregates={groupingAggregates}
        groups={groups}
        groupingColumn={groupingColumn}
      />
    </section>
  );
}

export default Aggregates;
