import React, { useState } from 'react';
import Tabs from '../layout/Tabs';
import Tags from './tags/TagList';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import Plots from './plots/Plots';
import Metadata from './Metadata';
import PlotsDefinitions from './PlotsDefinitions';
import Clickable from './Clickable';
import { populateCircularMa } from '../../tools/datatools';
import Details from './Details';

import './Metaanalysis.css';

// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);
  const [edit, setEdit] = useState(0);
  const [title] = useState(metaanalysis.title);
  const [tags] = useState(metaanalysis.tags);
  const [info] = useState({
    description: metaanalysis.description,
    published: metaanalysis.published,
  });
  const [table] = useState({
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
  const toggleDisplay = (cellId, details) => {
    if (cellId !== displayedCell.cellId) {
      setDisplayedCell({ text: details, cellId });
    } else {
      setDisplayedCell({ text: null, cellId: null });
    }
  };

  function makeClickable(cellId, details) {
    return {
      onClick: () => {
        setDisplayedCell({ text: details, cellId })},
      className: cellId === displayedCell.cellId ? 'active' : '',
    };
  }

  const clickable = <Clickable toggleDisplay={toggleDisplay} displayedCell={displayedCell} />;

  return (
    <main className="metaanalysis">
      <div className="titlebar">
        <div className="title">
          <p type="input">{title}</p>
        </div>
        <Tags edit={edit} tags={tags} />
        <button className={edit === 0 ? 'btn-start' : 'btn-stop'} type="button" onClick={() => setEdit(edit === 0 ? 1 : 0)}>{editButtonMessage}</button>
      </div>
      <Tabs toggleDisplay={toggleDisplay}>
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
          paperOrder={paperOrder}
          displayedCell={displayedCell}
          clickable={clickable}
          makeClickable={makeClickable}
        />
        <Aggregates
          path="/aggregates"
          tabName="Aggregates"
          aggregates={aggregates}
          groupingAggregates={groupingAggregates}
          groupingColumn={metaanalysis.groupingColumnObj.title}
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
        />
      </Tabs>
      <Details displayedCell={displayedCell} setDisplayedCell={setDisplayedCell} />
      <Metadata metadata={metadata} />
    </main>

  );
}

export default Metaanalysis;
