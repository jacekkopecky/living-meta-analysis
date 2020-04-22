/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Tags from './Tags';
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
  //  Recomputed data
  const computedColumns = computeColumns(columns);
  const computedPapers = computePapers(papers, columns);

  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <p className="title">
          {title}
        </p>
        <Tags tags={tags} />
      </div>
      <div className="content">
        <Info description={description} reference={published} />
        <DataTable columns={computedColumns} papers={computedPapers} />
      </div>
      <Metadata username={enteredByUsername} ctime={ctime} mtime={mtime} />
    </div>
  );
}

export default Metaanalysis;
