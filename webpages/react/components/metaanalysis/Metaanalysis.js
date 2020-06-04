import React, { useState } from 'react';
import Tabs from '../layout/Tabs';
import Tags from './tags/TagList';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import Plots from './plots/Plots';
import Metadata from './Metadata';
import PlotsDefinitions from './PlotsDefinitions';
import { populateCircularMa } from '../../tools/datatools';
import Details from './Details';

import './Metaanalysis.css';

// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);
  const [edit, setEdit] = useState(false);
  const [title] = useState(metaanalysis.title);
  const [tags] = useState(metaanalysis.tags);
  const [description, setDescription] = useState(metaanalysis.description);
  const [published, setPublished] = useState(metaanalysis.published);
  const [table, setTable] = useState({
    columns: metaanalysis.columns,
    papers: metaanalysis.papers,
    excluded: metaanalysis.excludedExperiments,
  });
  const [paperOrder] = useState(metaanalysis.paperOrder);
  const [aggregates] = useState(metaanalysis.aggregates);
  const [groupingAggregates] = useState(metaanalysis.groupingAggregates);
  const [graphs] = useState(metaanalysis.graphs);
  const [metadata] = useState({
    enteredByUsername: metaanalysis.enteredByUsername,
    ctime: metaanalysis.ctime,
    mtime: metaanalysis.mtime,
  });
  const [displayedCell, setDisplayedCell] = useState({
    cellId: null,
    text: null,
  });
  console.log(metaanalysis);

  const editButtonMessage = edit ? 'STOP' : 'EDIT';

  const makeClickable = (cellId, details, computed) => {
    let className = cellId === displayedCell.cellId ? 'active' : '';
    className += computed ? ' computed' : '';
    return {
      onClick: () => {
        setDisplayedCell({ text: details, cellId });
      },
      className,
    };
  }

  return (
    <main className="metaanalysis">
      <div className="titlebar">
        <div className="title">
          <p type="input">{title}</p>
        </div>
        <Tags edit={edit} tags={tags} />
        <button className={edit ? 'btn-stop' : 'btn-start'} type="button" onClick={() => setEdit(!edit)}>{editButtonMessage}</button>
      </div>
      <Tabs displayedCell={displayedCell} setDisplayedCell={setDisplayedCell}>
        <Info
          path="/info"
          tabName="Info"
          description={description}
          setDescription={setDescription}
          published={published}
          setPublished={setPublished}
          edit={edit}
        />
        <DataTable
          path="/table"
          tabName="Table"
          columns={table.columns}
          papers={table.papers}
          paperOrder={paperOrder}
          makeClickable={makeClickable}
          edit={edit}
        />
        <Aggregates
          path="/aggregates"
          tabName="Aggregates"
          aggregates={aggregates}
          groupingAggregates={groupingAggregates}
          groupingColumn={metaanalysis.groupingColumnObj ? metaanalysis.groupingColumnObj.title : undefined}
          groups={metaanalysis.groups}
          makeClickable={makeClickable}
        />
        <Plots
          path="/plots"
          tabName="Plots"
          graphs={graphs}
        />
        <PlotsDefinitions
          path="/plots_definitions"
          tabName="Plots Definitions"
          graphs={graphs}
          makeClickable={makeClickable}
        />
      </Tabs>
      <Details displayedCell={displayedCell} setDisplayedCell={setDisplayedCell} />
      <Metadata metadata={metadata} />
    </main>

  );
}

export default Metaanalysis;