import React from 'react';
import Cell from './Cell';
// TODO: find a cleaner way to import datatools

function Paper(props) {
  const {
    paper, columns, displayedCell, toggleDisplay,
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
      const expDetails = (
        <>
          <p>{title}</p>
          <p>{exp.title}</p>
          <p>{exp.description || 'no detailed description'}</p>
        </>
      );
      if (key === 0) {
        newPaper = (
          <td
            key={title}
            rowSpan={nExp}
            onClick={() => toggleDisplay(title+ctime, paperDetails)}
          >
            {title}
          </td>
        );
        firstTr = 'paperstart';
      }
      return (
        <tr
          key={exp.ctime + paper.id}
          className={firstTr}
        >
          {newPaper}
          <td key={exp.title} onClick={() => toggleDisplay(exp.ctime + paper.id, expDetails)}>
            {exp.title}
          </td>

          {columns.map((col) => (
            <Cell
              cellId={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              key={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              col={col}
              exp={exp}
              displayedCell={displayedCell}
              toggleDisplay={toggleDisplay}
            />
          ))}

        </tr>
      );
    })
  );
}

export default Paper;
