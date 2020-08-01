import React, { useContext, useRef } from 'react';
import Paper from './Paper';
import AddPaper from '../AddPaper';
import Editable from '../Editable';
import EditContext from '../EditContext';

import './DataTable.css';

const paperColumnDetails = (
  <>
    <p>Paper column</p>
  </>
);
const expColumnDetails = (
  <>
    <p>Study/Experiment column</p>
  </>
);

const dataColDetails = (col) => (
  <>
    <p><Editable type="input" cellId={col.id}>{ col.title }</Editable></p>
    <p><Editable type="input" cellId={col.id}>{ col.description || 'no detailed description' }</Editable></p>
  </>

);

const computedColDetails = (col) => (
  <>
    <p>{ col.title }</p>
    <p>{ col.fullLabel }</p>
  </>
);

function DataTable(props) {
  const {
    columns, papers, paperOrderValue, makeClickable, editCell, metaanalysis,
  } = props;
  const [paperState, setPaperState] = papers;
  const [paperOrder, setPaperOrder] = paperOrderValue;

  const getColNums = (cols) => {
    let numMods = 0;
    let numCalcs = 0;
    let numData = 0;
    cols.forEach((column) => {
      if (column.subType === 'moderator') {
        numMods += 1;
      } else if (column.subType === 'calculator') {
        numCalcs += 1;
      } else if (column.subType === 'result') {
        numData += 1;
      }
    });
    return [numMods, numCalcs, numData];
  };
  const [moderatorNumber, calculatorNumber, dataNumber] = getColNums(columns);

  const edit = useContext(EditContext);
  const parentOfRows = useRef(null);

  return (
    <section>
      <table className="datatable">
        <colgroup>
          <col className="paperColumn" span="2" />
          { (moderatorNumber > 0) ? <col className="moderatorColumn" span={moderatorNumber} /> : null }
          { (calculatorNumber > 0) ? <col className="calculatorColumn" span={calculatorNumber} /> : null }
          { (dataNumber > 0) ? <col className="dataColumn" span={dataNumber} /> : null }
        </colgroup>
        <thead>
          <tr className="columnHeadings">
            <th className="paperColumnHeader" colSpan="2">Paper specific columns</th>
            { (moderatorNumber > 0) ? <th className="moderatorColumnHeader" colSpan={moderatorNumber}>Moderator columns</th> : null }
            { (calculatorNumber > 0) ? <th className="calculatorColumnHeader" colSpan={calculatorNumber}>Calculator columns</th> : null }
            { (dataNumber > 0) ? <th className="dataColumnHeader" colSpan={dataNumber}>Calculated result columns</th> : null }
          </tr>
        </thead>
        <thead>
          <tr>
            <th {...makeClickable('Paper', paperColumnDetails)} className={`${edit.flag ? 'editMode primary' : ''}`}>
              <AddPaper
                paperState={[paperState, setPaperState]}
                paperOrderValue={[paperOrder, setPaperOrder]}
                metaanalysis={metaanalysis}
              />
            </th>
            <th {...makeClickable('Study/Experiment', expColumnDetails)} className={`${edit.flag ? 'editMode primary' : ''}`}>
              Study/Experiment
            </th>
            { columns.map((col) => (
              <th
                key={col.id || col.fullLabel}
                {...makeClickable(
                  col.id || col.fullLabel,
                  col.id ? dataColDetails(col) : computedColDetails(col),
                )}
                className={`${edit.flag ? 'editMode primary' : ''}`}
              >
                { col.title || col.fullLabel }
              </th>
            )) }
          </tr>
        </thead>
        <tbody ref={parentOfRows}>
          { paperOrder.map((id) => (
            Object.values(paperState).map((paper) => (
              paper.id === id
                ? (
                  <Paper
                    key={paper.id + paper.title}
                    paper={paper}
                    columns={columns}
                    makeClickable={makeClickable}
                    editCell={editCell}
                    parentOfRows={parentOfRows}
                    papers={[paperState, setPaperState]}
                    paperOrderValue={[paperOrder, setPaperOrder]}
                  />
                )
                : null
            ))
          )) }
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
