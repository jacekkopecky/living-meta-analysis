import React, { useState, useContext } from 'react';
import Tabs from '../layout/Tabs';
import TagList from './tags/TagList';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import Plots from './plots/Plots';
import Metadata from './Metadata';
import PlotsDefinitions from './PlotsDefinitions';
import Details from './Details';
import EditContext from './EditContext';

import { populateCircularMa } from '../../tools/datatools';
import replaceCell from '../../tools/editTools';

import './Metaanalysis.css';

function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);
  window.currentMa = metaanalysis;

  const [title] = useState(metaanalysis.title);
  const [tags, setTags] = useState(metaanalysis.tags);
  const [description, setDescription] = useState(metaanalysis.description);
  const [published, setPublished] = useState(metaanalysis.published);
  const [columns] = useState(metaanalysis.columns);
  const [papers, setPapers] = useState(metaanalysis.papers);
  const [paperOrder, setPaperOrder] = useState(metaanalysis.paperOrder);
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
  const edit = useContext(EditContext);

  const assignSubType = (cols) => {
    const columnsClone = [...cols];
    columnsClone.forEach((column) => {
      if (column.id === '1' || column.id === '2' || column.id === '7') {
        column.subType = 'moderator';
      } else if (column.type !== 'result') {
        column.subType = 'calculator';
      } else { column.subType = 'result'; }
    });
    return columnsClone;
  };

  const reorderColumnsBySubtype = (cols) => {
    const columnsClone = [...cols];
    const modCols = [];
    const calcCols = [];
    const dataCols = [];
    columnsClone.forEach((column) => {
      if (column.subType === 'moderator') {
        modCols.push(column);
      } else if (column.subType === 'calculator') {
        calcCols.push(column);
      } else if (column.subType === 'result') {
        dataCols.push(column);
      }
    });
    const orderedCols = modCols.concat(calcCols.concat(dataCols));
    return orderedCols;
  };

  const columnsClone = reorderColumnsBySubtype(assignSubType(columns));

  const makeClickable = (cellId, details, cellType) => {
    let className = '';
    if (displayedCell && cellId === displayedCell.cellId) className += 'active ';
    if (cellType === 'computed') {
      className += `computed ${edit.flag ? 'editMode cell' : ''}`;
    } else if (cellType === 'paper') {
      className += `paper ${edit.flag ? 'editMode cell' : ''}`;
    }

    return {
      onClick: () => {
        setDisplayedCell({ text: details, cellId });
      },
      className,
    };
  };

  const editCell = (value, cellId) => {
    if (!value) { value = null; }
    setPapers(replaceCell(papers, columnsClone, value, cellId));
  };

  return (
    <main className="metaanalysis">
      <div className={`titlebar ${edit.flag ? 'editMode primary' : ''}`}>
        <div className="title">
          <p type="input">{ title }</p>
        </div>
        <div className="titleBarButtons">
          { /*<TagList tags={tags} setTags={setTags} />*/ }
          <span
            id="toggle-editing"
            role="menuitem"
            tabIndex="0"
            onMouseDown={edit.toggle}
            onKeyPress={edit.toggle}
            className={`${edit.flag ? 'editMode' : ''}`}
          >
            { edit.flag ? 'Stop editing' : 'Edit' }
          </span>
        </div>
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
          columns={columnsClone}
          papers={[papers, setPapers]}
          paperOrderValue={[paperOrder, setPaperOrder]}
          makeClickable={makeClickable}
          editCell={editCell}
          metaanalysis={metaanalysis}
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
