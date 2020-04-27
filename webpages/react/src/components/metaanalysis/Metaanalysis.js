/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import Tabs from '../layout/Tabs';
import Tags from './tags/Tags';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Metadata from './Metadata';
import columnOrders from './Datatools';

import './Metaanalysis.css';


// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const { items } = props;
  const [edit, setEdit] = useState(0);
  const [title, setTitle] = useState(items.title);
  const [tags, setTags] = useState(items.tags);
  const [info, setInfo] = useState({ description: items.description, published: items.published });
  const [table, setTable] = useState({
    columns: items.columns,
    papers: items.papers,
  });
  const [metadata, setMetadata] = useState({
    enteredByUsername: items.enteredByUsername,
    ctime: items.ctime,
    mtime: items.mtime,
  });

  const editButtonMessage = edit ? 'STOP' : 'EDIT';

  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <p className="title" onChange={(value) => setTitle(value)}>{title}</p>
        <Tags edit={edit} tags={tags} />
        <button className={edit === 0 ? 'btn-start' : 'btn-stop'} type="button" onClick={() => setEdit(edit === 0 ? 1 : 0)}>{editButtonMessage}</button>
      </div>
      <Tabs>
        <Info
          path="/info"
          tabName="Info"
          description={info.description}
          reference={info.published}
        />
        <DataTable
          path="/table"
          tabName="Table"
          columns={table.columns}
          papers={table.papers}
          columnOrders={columnOrders(table.papers, table.columns)}
        />
      </Tabs>
      <Metadata
        username={metadata.enteredByUsername}
        ctime={metadata.ctime}
        mtime={metadata.mtime}
      />
    </div>

  );
}

export default Metaanalysis;
