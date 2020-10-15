import React from 'react';
import SimpleAggregates from './SimpleAggregates';
import GroupingAggregates from './GroupingAggregates';
import './Aggregates.css';

function Aggregates(props) {
  const {
    aggregates,
    groupingAggregates,
    groups,
    groupingColumn,
    clickable,
    makeClickable,
  } = props;
  return (
    <section className="aggregates">
      <SimpleAggregates
        aggregates={aggregates}
        clickable={clickable}
        makeClickable={makeClickable}
      />
      { groupingColumn
        ? (
          <GroupingAggregates
            groupingAggregates={groupingAggregates}
            groups={groups}
            groupingColumn={groupingColumn}
            clickable={clickable}
            makeClickable={makeClickable}
          />
        )
        : null }

    </section>
  );
}

export default Aggregates;
