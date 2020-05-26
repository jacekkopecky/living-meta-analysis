import React from 'react';
import Cell from './Cell';

function Paper(props) {
  const {
    paper, columns, clickable,
  } = props;
  const {
    title, enteredBy, mtime, ctime,
  } = paper;
  const paperDetails = (
    <>
      <p>
        Paper:
        {' '}
        {title}
      </p>
      <p>
        Entered by
        {' '}
        {enteredBy}
        {' '}
        on
        {' '}
        {ctime}
      </p>
      <p>Reference: </p>
      <p>Description: </p>
      <p>Link: </p>
      <p>DOI: </p>
      <p>
        Last Modified:
        {' '}
        {mtime}
      </p>
    </>
  );
  const nExp = Object.keys(paper.experiments).length;

  return (
    paper.experiments.map((exp, key) => {
      let newPaper;
      let firstTr;
      if (key === 0) {
        newPaper = (
          <clickable.type
            {...clickable.props}
            key={title}
            cellId="Study/Experiment"
            cellContent={<td rowSpan={nExp}>{title}</td>}
            cellDetails={paperDetails}
          />
        );
        firstTr = 'paperstart';
      }
      return (
        <tr
          key={exp.ctime + paper.id}
          className={firstTr}
        >
          {newPaper}
          <clickable.type
            {...clickable.props}
            key={exp.title}
            cellId={exp.ctime + paper.id}
            cellContent={<td>{exp.title}</td>}
            cellDetails={(
              <>
                <p>{title}</p>
                <p>{exp.title}</p>
                <p>{exp.description || 'no detailed description'}</p>
              </>
            )}
          />

          {columns.map((col) => (
            <Cell
              cellId={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              key={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              col={col}
              exp={exp}
              clickable={clickable}
            />
          ))}

        </tr>
      );
    })
  );
}

export default Paper;
