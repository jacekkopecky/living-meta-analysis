import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';

function Aggregates(props) {
  const { aggregates, groupingAggregates, groups } = props;
  return (
    <section>
      <SimpleAggregates aggregates={aggregates} />
      <GroupingAggregates groupingAggregates={groupingAggregates} groups={groups} />
    </section>
  );
}

export default Aggregates;
