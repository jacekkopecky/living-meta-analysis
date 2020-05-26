/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Paper from './Paper';
import './DataTable.css';

function DataTable(props) {
  const {
    columns, papers, clickable, paperOrder,
  } = props;

  return (
    <section>
      <table className="datatable">
        <thead>
          <tr>
            <clickable.type
              {...clickable.props}
              cellId="Paper"
              cellContent={<th>Paper</th>}
              cellDetails={(
                <>
                  <p>Paper</p>
                  <p>Paper description :</p>
                </>
              )}
            />
            <clickable.type
              {...clickable.props}
              cellId="Study/Experiment"
              cellContent={<th>Study/Experiment</th>}
              cellDetails={(
                <>
                  <p>Study/Experiment</p>
                  <p>Experiment description :</p>
                </>
              )}
            />

            {columns.map((col) => (
              <clickable.type
                {...clickable.props}
                cellId={col.title}
                key={col.title}
                cellContent={<th>{col.title}</th>}
                cellDetails={(
                  col.id
                    ? (
                      <>
                        <p>{col.title}</p>
                        <p>{col.description || 'no detailed description'}</p>
                      </>
                    )
                    : (
                      <>
                        <p>{col.title}</p>
                        <p>
                          {col.fullLabel}
                        </p>
                      </>
                    )
                )}
              />

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
                    clickable={clickable}
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
