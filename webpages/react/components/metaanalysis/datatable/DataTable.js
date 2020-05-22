import React from 'react';
import Paper from './Paper';
import './DataTable.css';
// import Clickable from '../Clickable';

function DataTable(props) {
  const {
    columns, papers, displayedCell, toggleDisplay, Clickable,
  } = props;

  return (
    <section>
      <table className="datatable">
        <thead>
          <tr>
            <th>
              Paper
            </th>
            <th>
              Study/Experiment
            </th>
            {columns.map((col) => {
              let colDetails;
              if (col.id) {
                colDetails = (
                  <>
                    <p>{col.title}</p>
                    <p>{col.description || 'no detailed description'}</p>
                  </>
                );
              } else {
                colDetails = (
                  <>
                    <p>{col.title}</p>
                    <p>
                      {col.fullLabel}
                    </p>
                  </>
                );
              }
              const cellContent = (
                <th>
                  {col.title}
                </th>
              );
              // const rendu = clickable(col.title, cellContent, colDetails);
              return (
                <Clickable.type
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...Clickable.props}
                  cellId={col.title}
                  key={col.title}
                  cellContent={(
                    <th>
                      {col.title}
                    </th>
                  )}
                  cellDetails={
                    colDetails
                  }
                />
                // <>
                //   {rendu}
                // </>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Object.values(papers).map((paper) => (
            <Paper
              key={paper.id + paper.title}
              paper={paper}
              columns={columns}
              displayedCell={displayedCell}
              toggleDisplay={toggleDisplay}
              // clickable={clickable}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DataTable;
