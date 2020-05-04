import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';

function Aggregates(props) {
  const { aggregates, groupingAggregates } = props;
  return (
    <>
      <SimpleAggregates aggregates={aggregates} />
      <GroupingAggregates groupingAggregates={groupingAggregates} />
    </>
  );
}

export default Aggregates;
