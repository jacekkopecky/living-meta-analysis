import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function fillTableHead(columns) {
  return (
    <tr>
      <th>Paper</th>
      <th>Study/Experiment</th>
      {columns.map((col) => <th>{col.title}</th>)}
    </tr>
  );
}


function DataTable(props) {
  const { columns, papers } = props;
  return (
    <table className="datatable">
      <thead>
        {fillTableHead(columns)}
      </thead>
      <tbody>
        {papers.map((paper) => <Paper data={paper} />)}
      </tbody>
    </table>
  );
}


export default DataTable;
