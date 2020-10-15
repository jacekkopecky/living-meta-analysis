import React, { useState } from 'react';
import Tabs from '../layout/Tabs';
import TagList from './tags/TagList';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import Plots from './plots/Plots';
import Metadata from './Metadata';
import PlotsDefinitions from './PlotsDefinitions';
import Details from './Details';

import { populateCircularMa } from '../../tools/datatools';
import replaceCell from '../../tools/editTools';

import './Metaanalysis.css';

function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);

  const [title] = useState(metaanalysis.title);
  const [tags, setTags] = useState(metaanalysis.tags);
  const [description, setDescription] = useState(metaanalysis.description);
  const [published, setPublished] = useState(metaanalysis.published);
  const [columns] = useState(metaanalysis.columns);
  const [papers, setPapers] = useState(metaanalysis.papers);
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

  const makeClickable = (cellId, details, computed) => {
    let className = '';
    if (displayedCell && cellId === displayedCell.cellId) className += 'active ';
    if (computed) className += 'computed ';

    return {
      onClick: () => {
        setDisplayedCell({ text: details, cellId });
      },
      className,
    };
  };

  const editCell = (value, cellId) => {
    setPapers(replaceCell(papers, columns, value, cellId));
  };

  return (
    <main className="metaanalysis">
      <div className="titlebar">
        <div className="title">
          <p type="input">{ title }</p>
        </div>
        <TagList tags={tags} setTags={setTags} />
      </div>
      <Tabs displayedCell={displayedCell} setDisplayedCell={setDisplayedCell}>
        <Info
          path="/info"
          tabName="Info"
          description={description}
          setDescription={setDescription}
          published={published}
          setPublished={setPublished}
        />
        <DataTable
          path="/table"
          tabName="Table"
          columns={columns}
          papers={papers}
          paperOrder={paperOrder}
          makeClickable={makeClickable}
          editCell={editCell}
        />
        <Aggregates
          path="/aggregates"
          tabName="Aggregates"
          aggregates={aggregates}
          groupingAggregates={groupingAggregates}
          groupingColumn={
            metaanalysis.groupingColumnObj ? metaanalysis.groupingColumnObj.title : undefined
          }
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
