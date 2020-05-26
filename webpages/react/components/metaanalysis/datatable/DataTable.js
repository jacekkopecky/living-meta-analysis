/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Paper from './Paper';
import './DataTable.css';
// import Clickable from '../Clickable';

function DataTable(props) {
  const {
    columns, papers, Clickable,
  } = props;

  return (
    <section>
      <table className="datatable">
        <thead>
          <tr>
            <Clickable.type
              {...Clickable.props}
              cellId="Paper"
              cellContent={<th>Paper</th>}
              cellDetails={(
                <>
                  <p>Paper</p>
                  <p>Paper description :</p>
                </>
              )}
            />
            <Clickable.type
              {...Clickable.props}
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
              <Clickable.type
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...Clickable.props}
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
          {Object.values(papers).map((paper) => (
            <Paper
              key={paper.id + paper.title}
              paper={paper}
              columns={columns}
              Clickable={Clickable}

            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
