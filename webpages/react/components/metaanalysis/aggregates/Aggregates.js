import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';

function Aggregates(props) {
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
