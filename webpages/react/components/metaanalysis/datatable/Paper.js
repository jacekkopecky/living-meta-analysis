import React from 'react';
import { getDatumValue, formatNumber } from '../../../tools/datatools';
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

          {columns.map((col) => {
            let value = getDatumValue(col, exp);
            let className;
            if (col.id) {
              className = 'data';
            } else {
              value = formatNumber(value);
              className = 'computed';
            }
            return (
              <td className={className} key={col.id}>{value}</td>
            );
          })}

        </tr>
      );
    })
  );
}

export default Paper;
