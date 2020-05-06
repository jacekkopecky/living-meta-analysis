import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function DataTable(props) {
  /* TODO: delete columnOrders */
  const { columns, papers } = props;
  return (
    <section>
      <table className="datatable table table-striped table-header-rotated">
        <thead>
          <tr>
            <th className="rotate"><div><span>Paper</span></div></th>
            <th className="rotate"><div><span>Study/Experiment</span></div></th>
            { columns.map((col) => <th key={col.title} className="rotate"><div><span>{col.title}</span></div></th>) }
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
    </section>
  );
}


export default DataTable;
