import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function DataTable(props) {
  /* TODO: delete columnOrders */
  const { columns, papers } = props;
  return (
    <table className="datatable">
      <thead>
        <tr>
          <th>Paper</th>
          <th>Study/Experiment</th>
          { columns.map((col) => <th key={col.title}>{col.title}</th>) }
        </tr>
      </thead>
      <tbody>
        {
          Object.values(papers).map((paper) => (
            <Paper
              key={paper.id + paper.title}
              paper={paper}
              columns={columns}
            />
          ))
        }
      </tbody>
    </table>
  );
}


export default DataTable;
