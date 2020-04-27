import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function DataTable(props) {
  /* TODO: columnOders probably wants to be a state because
  it's useless for the parent component */
  const { columns, papers, columnOrders } = props;
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
          Object.values(papers).map((paper, index) => (
            <Paper
              key={paper.id + paper.title}
              paper={paper}
              columns={columns}
              columnOrder={columnOrders[index]}
            />
          ))
        }
      </tbody>
    </table>
  );
}


export default DataTable;
