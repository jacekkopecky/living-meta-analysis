/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Paper from './Paper';
import Editable from '../Editable';

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
    <p><Editable type="input" cellId={col.id}>{col.title}</Editable></p>
    <p><Editable type="input" cellId={col.id}>{col.description || 'no detailed description'}</Editable></p>
  </>

);

const computedColDetails = (col) => (
  <>
    <p>{col.title}</p>
    <p>{col.fullLabel}</p>
  </>
);

function DataTable(props) {
  const {
    columns, papers, paperOrder, makeClickable, editCell,
  } = props;

  return (
    <section>
      <table className="datatable">
        <thead>
          <tr>
            <th {...makeClickable('Paper', paperColumnDetails)}>
              Paper
            </th>
            <th {...makeClickable('Study/Experiment', expColumnDetails)}>
              Study/Experiment
            </th>
            {columns.map((col) => (
              <th
                key={col.id || col.fullLabel}
                {...makeClickable(
                  col.id || col.fullLabel,
                  col.id ? dataColDetails(col) : computedColDetails(col),
                )}
              >
                {col.title || col.fullLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paperOrder.map((id) => (
            Object.values(papers).map((paper) => (
              paper.id === id
                ? (
                  <Paper
                    key={paper.id + paper.title}
                    paper={paper}
                    columns={columns}
                    makeClickable={makeClickable}
                    editCell={editCell}
                  />
                )
                : null
            ))
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
