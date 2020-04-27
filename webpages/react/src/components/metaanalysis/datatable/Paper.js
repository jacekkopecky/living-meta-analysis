import React from 'react';

function Paper(props) {
  const { paper, columnOrder } = props;
  const { title } = paper;
  const nExp = Object.keys(paper.experiments).length;

  return (
    Object.values(paper.experiments).map((exp, key) => {
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
          {columnOrder.map((value) => {
            const cell = exp.data[value];
            if (cell !== undefined) {
              return (
                <td key={value}>{cell.value}</td>
              );
            }
            return (
              <td key={value} />
            );
          })}
        </tr>
      );
    })
  );
}

export default Paper;
