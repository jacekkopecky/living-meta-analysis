import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';

function Aggregates(props) {
  const {
    aggregates,
    groupingAggregates,
    groups,
    groupingColumn,
    clickable,
  } = props;
  return (
    <section>
      <SimpleAggregates
        aggregates={aggregates}
        clickable={clickable}
        /* groupingColumnsObjs={} */
      />

      {/* TODO:  map on groupingColObj => multiple grouping aggregates */}
      <GroupingAggregates
        groupingAggregates={groupingAggregates}
        groups={groups}
        groupingColumn={groupingColumn}
        clickable={clickable}
      />
    </section>
  );
}

// TODO: change this when adding onClick styles etc, see Cell
export default React.memo(Aggregates, () => true);
