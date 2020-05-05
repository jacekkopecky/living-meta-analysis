import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';

function Aggregates(props) {
  const { aggregates, groupingAggregates, groups } = props;
  return (
    <>
      <SimpleAggregates aggregates={aggregates} />
      <GroupingAggregates groupingAggregates={groupingAggregates} groups={groups} />
    </>
  );
}

export default Aggregates;
