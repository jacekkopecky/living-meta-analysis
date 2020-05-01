import React from 'react';
import { getDatumValue } from '../Datatools';

function Paper(props) {
  const { paper, columns } = props;
  const { title } = paper;
  const nExp = Object.keys(paper.experiments).length;

  return (
    paper.experiments.map((exp, key) => {
      let newPaper;
      let firstTr;
      if (key === 0) {
        newPaper = (
          <td key={title} rowSpan={nExp}>
            {title}
          </td>
        );
        firstTr = 'paperstart';
      }
      return (
        <tr key={exp.ctime + paper.id} className={firstTr}>
          {newPaper}
          <td>
            {exp.title}
          </td>
          {columns.map((col) => {
            const value = getDatumValue(col, exp);
            const fixed = col.id ? value : value.toFixed(3);
            return (
              <td>{fixed}</td>
            );
          })}
        </tr>
      );
    })
  );
}

export default Paper;
