import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';

function Paper(props) {
  const { paper, columns } = props;
  const { title } = paper;
  console.log(paper.experiments);
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
            const value = getDatumValue(col, exp, undefined);
            const fixed = col.id ? value : formatNumber(value);
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
