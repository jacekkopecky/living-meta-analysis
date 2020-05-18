import React from 'react';
import Cell from './Cell';
// TODO: find a cleaner way to import datatools

function Paper(props) {
  const { paper, columns } = props;
  const { title } = paper;
  const nExp = Object.keys(paper.experiments).length;

  return (
    paper.experiments.map((exp, key) => {
      let newPaper;
      let firstTr;
      if (key === 0) {
        newPaper = <td key={title} rowSpan={nExp}>{title}</td>;
        firstTr = 'paperstart';
      }
      return (
        <tr key={exp.ctime + paper.id} className={firstTr}>
          {newPaper}
          <td key={exp.title}>
            {exp.title}
          </td>

          {columns.map((col) => (
            <Cell col={col} exp={exp} />
          ))}

        </tr>
      );
    })
  );
}

export default Paper;
