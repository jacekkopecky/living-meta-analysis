import React from 'react';
import Paper from './Paper';
import { populateAllParsedFormulas } from '../Datatools';
import './DataTable.css';

function DataTable(props) {
  /* TODO: delete columnOrders */
  const { columns, papers, columnOrders, excluded } = props;
  const formulas = populateAllParsedFormulas(columns);
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
              formulas={formulas}
              columnOrder={columnOrders[index]}
              papers={papers}
              excluded={excluded}
            />
          ))
        }
      </tbody>
    </table>
  );
}


export default DataTable;
