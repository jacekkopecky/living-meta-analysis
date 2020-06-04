/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Paper from './Paper';
import './DataTable.css';

const paperColumnDetails = (
  <>
    <p>Paper</p>
    <p>Paper description :</p>
  </>
);
const expColumnDetails = (
  <>
    <p>Study/Experiment</p>
    <p>Experiment description :</p>
  </>
);

const dataColDetails = (col) => (
  <>
    <p>{col.title}</p>
    <p>{col.description || 'no detailed description'}</p>
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
    columns, papers, paperOrder, makeClickable, edit,
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
                    edit={edit}
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
