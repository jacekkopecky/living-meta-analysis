import React, { useState } from 'react';
import Tabs from '../layout/Tabs';
import Tags from './tags/Tags';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import Metadata from './Metadata';
import { populateCircularMa } from '../../tools/datatools';

import './Metaanalysis.css';

// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);
  const [edit, setEdit] = useState(0);
  const [title, setTitle] = useState(metaanalysis.title);
  const [tags, setTags] = useState(metaanalysis.tags);
  const [info, setInfo] = useState({
    description: metaanalysis.description,
    published: metaanalysis.published,
  });
  const [table, setTable] = useState({
    columns: metaanalysis.columns,
    papers: metaanalysis.papers,
    excluded: metaanalysis.excludedExperiments,
  });
  const [aggregates, setAggregates] = useState(metaanalysis.aggregates);
  const [groupingAggregates, setGroupingAggregates] = useState(metaanalysis.groupingAggregates);
  const [metadata, setMetadata] = useState({
    enteredByUsername: metaanalysis.enteredByUsername,
    ctime: metaanalysis.ctime,
    mtime: metaanalysis.mtime,
  });

  console.log(metaanalysis);

  const editButtonMessage = edit ? 'STOP' : 'EDIT';

  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <div className="title">
          <p type="input">{title}</p>
        </div>
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
        />
        <Aggregates
          path="/aggregates"
          tabName="Aggregates"
          aggregates={aggregates}
          groupingAggregates={groupingAggregates}
          groups={metaanalysis.groups}
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
