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

// TODO: pbbly possible to find a nice way to use populate

function DataTable(props) {
  const {
    columns, papers, clickable, paperOrder, makeClickable,
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
                {...makeClickable(
                  col.title,
                  col.id ? dataColDetails(col) : computedColDetails(col),
                )}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paperOrder.map((id) => (
            Object.values(papers).map((paper) => {
              if (paper.id === id) {
                return (
                  <Paper
                    key={paper.id + paper.title}
                    paper={paper}
                    columns={columns}
                    makeClickable={makeClickable}
                  />
                );
              }
              return null;
            })

          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
