/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
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
  const [edit, setEdit] = useState(0);
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
  const editButtonMessage = edit ? 'STOP' : 'EDIT';

  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <p className="title">
          {title}
        </p>
        <Tags edit={edit} tags={tags} />
        <button className={edit === 0 ? 'btn-start' : 'btn-stop'} type="button" onClick={() => setEdit(edit === 0 ? 1 : 0)}>{editButtonMessage}</button>
      </div>
      <Router hashType="noslash">
        <Tabs />
        <Switch>
          <Route
            path="/info"
            render={(prop) => (
              <Info
                {...prop}
                description={description}
                reference={published}
              />
            )}
          />
          <Route
            path="/table"
            render={(prop) => (
              <DataTable
                {...prop}
                columns={computedColumns}
                papers={computedPapers}
              />
            )}
          />
        </Switch>
        <Metadata username={enteredByUsername} ctime={ctime} mtime={mtime} />
      </Router>
    </div>

  );
}

export default Metaanalysis;
