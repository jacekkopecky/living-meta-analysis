/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Tabs from '../layout/Tabs';
import Tags from './tags/Tags';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Metadata from './Metadata';
import { computeColumns, computePapers } from './Datatools';

import './Metaanalysis.css';

// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const { items } = props;
  // Tags
  const { tags } = items;
  // Info
  const { title, description, published } = items;
  // Table
  const { columns, papers } = items;
  // Metadata
  const { enteredByUsername, ctime, mtime } = items;
  //  Recomputed data => easier to use
  const computedColumns = computeColumns(columns);
  const computedPapers = computePapers(papers, computedColumns);

  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <p className="title">
          {title}
        </p>
        <Tags tags={tags} />
      </div>
      <Tabs>
        MA-Info
        <span>
          <Info description={description} reference={published} />
        </span>
        MA-Table
        <span>
          <DataTable columns={computedColumns} papers={computedPapers} />
        </span>
        MA-Plots
        <span>Nice plots !</span>
        MA-Aggregates
        <span>Nice aggregates !</span>
        Plots-definitions
        <span>Nice definitions !</span>
      </Tabs>
      <Metadata username={enteredByUsername} ctime={ctime} mtime={mtime} />
    </div>
  );
}

export default Metaanalysis;
