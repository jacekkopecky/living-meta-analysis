/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
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
  console.log(`${window.location.pathname}#info`);
  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <p className="title">
          {title}
        </p>
        <Tags tags={tags} />
      </div>
      <Router hashType="slash">
        <Tabs />
        <Switch>
          <Route
            path={`/info`}
            render={(props) => <Info {...props} description={description} reference={published} />}
          />
          <Route
            path={`/table`}
            render={(props) => <DataTable {...props} columns={computedColumns} papers={computedPapers} />}
          />
        </Switch>
        <Metadata username={enteredByUsername} ctime={ctime} mtime={mtime} />
      </Router>
    </div>

  );
}

export default Metaanalysis;
