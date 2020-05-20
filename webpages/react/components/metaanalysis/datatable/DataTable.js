import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function DataTable(props) {
  const {
    columns, papers, displayedCell, setDisplayedCell,
  } = props;

  return (
    <section>
      <table className="datatable table table-striped table-header-rotated">
        <thead>
          <tr>
            <th>
              Paper
            </th>
            <th>
              Study/Experiment
            </th>
            {columns.map((col) => (
              <th key={col.title}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.values(papers).map((paper) => (
            <Paper
              key={paper.id + paper.title}
              paper={paper}
              columns={columns}
              displayedCell={displayedCell}
              setDisplayedCell={setDisplayedCell}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
