import React, { useState, useContext } from 'react';
import Tabs from '../layout/Tabs';
// import TagList from './tags/TagList';
import Info from './Info';
import DataTable from './datatable/DataTable';
import Aggregates from './aggregates/Aggregates';
import PlotSelector from './plots/PlotSelector';
import Metadata from './Metadata';
import Details from './Details';
import EditContext from './EditContext';
import UserContext from './UserContext';

import { populateCircularMa, getDatumValue } from '../../tools/datatools';
import replaceCell from '../../tools/editTools';
import modifyColumns from '../../tools/modifyColumns';

import './Metaanalysis.css';

function Metaanalysis(props) {
  const { metaanalysis } = props;
  populateCircularMa(metaanalysis);
  window.currentMa = metaanalysis;

  const [title] = useState(metaanalysis.title);
  // const [tags, setTags] = useState(metaanalysis.tags);
  const [description, setDescription] = useState(metaanalysis.description);
  const [published, setPublished] = useState(metaanalysis.published);
  const [columns, setColumns] = useState(metaanalysis.columns);
  const [papers, setPapers] = useState(metaanalysis.papers);
  const [paperOrder, setPaperOrder] = useState(metaanalysis.paperOrder);
  const [aggregates, setAggregates] = useState(metaanalysis.aggregates);
  const [groupingAggregates, setGroupingAggregates] = useState(metaanalysis.groupingAggregates);
  const [graphs, setGraphs] = useState(metaanalysis.graphs);
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
  const currentUser = useContext(UserContext);

  const columnsClone = modifyColumns(columns);
  const moderators = columns.filter((col) => col.subType === 'moderator');
  const moderatorsWithGroups = [];
  for (let i = 0; i < moderators.length; i += 1) {
    const groups = [];
    for (const paper of papers) {
      for (const exp of paper.experiments) {
        if (!exp.excluded) {
          const group = getDatumValue(moderators[i], exp);
          if (group != null && group !== '' && groups.indexOf(group) === -1) {
            groups.push(group);
          }
        }
      }
    }
    const groupsWithIncluded = [];
    for (let j = 0; j < groups.length; j += 1) {
      groupsWithIncluded[j] = {
        group: groups[j],
        included: true,
      };
    }
    moderatorsWithGroups[i] = {
      moderatorObj: moderators[i],
      groups: groupsWithIncluded,
      included: true,
    };
  }
  moderatorsWithGroups.sort((a, b) => {
    if (a.groups.length < b.groups.length) {
      return -1;
    }
    if (a.groups.length > b.groups.length) {
      return 1;
    }
    return 0;
  });

  const assignGraphId = (graphObjs) => {
    for (let i = 0; i < graphObjs.length; i += 1) {
      graphs[i].id = i;
    }
  };
  assignGraphId(graphs);

  const makeClickable = (cellId, details, cellType, defaultClass) => {
    let className = defaultClass || '';
    if (displayedCell && cellId === displayedCell.cellId) className += ' active ';
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
    setPapers(replaceCell(papers, columnsClone, value, cellId, currentUser));
  };
  return (
    <main className="metaanalysis">
      <div className={`titlebar ${edit.flag ? 'editMode primary' : ''}`}>
        <div className="title">
          <p type="input">{ title }</p>
        </div>
        <div className="titleBarButtons">
          { /* <TagList tags={tags} setTags={setTags} /> */ }
          { currentUser
            ? (
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
            )
            : (
              <span
                id="toggle-editing-inactive"
                role="menuitem"
                tabIndex="0"
              >
                Sign in to edit
              </span>
            ) }
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
          columnState={[columnsClone, setColumns]}
          papers={[papers, setPapers]}
          paperOrderValue={[paperOrder, setPaperOrder]}
          makeClickable={makeClickable}
          editCell={editCell}
          metaanalysis={metaanalysis}
          aggregates={aggregates}
        />
        <Aggregates
          path="/aggregates"
          tabName="Analyses"
          aggregatesState={[aggregates, setAggregates]}
          groupingAggregatesState={[groupingAggregates, setGroupingAggregates]}
          groupingColumn={
            metaanalysis.groupingColumnObj ? metaanalysis.groupingColumnObj.title : undefined
          }
          groups={metaanalysis.groups}
          makeClickable={makeClickable}
          moderatorsWithGroups={moderatorsWithGroups}
          columns={columnsClone}
          metaanalysis={metaanalysis}
        />
        <PlotSelector
          path="/plots"
          tabName="Plots"
          graphState={[graphs, setGraphs]}
          columns={columnsClone}
          metaanalysis={metaanalysis}
        />
      </Tabs>
      <Details displayedCell={displayedCell} setDisplayedCell={setDisplayedCell} />
      <Metadata metadata={metadata} />
    </main>
  );
}

export default Metaanalysis;
