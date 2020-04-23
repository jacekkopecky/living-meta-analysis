import React from 'react';

function Paper(props) {
  const { data } = props;
  const { columnOrder } = data;

  // TODO: cleanup a little

  return (
    data.experiments.map((exp, key) => {
      // we'll create a paper title td element only when the row is a new paper
      let newPaper;
      let firstTr;
      const values = [];
      if (key === 0) {
        newPaper = (
          <td rowSpan={data.nExp}>
            {data.title}
          </td>
        );
        firstTr = 'paperstart';
      }
      return (
        <tr key={exp.ctime + data.id} className={firstTr}>
          {newPaper}
          <td>
            {exp.title}
          </td>
          {columnOrder.map((value) => {
            const index = exp.index.indexOf(value);
            const cell = exp.values[index];
            values.push(cell);
            return (
              <td key={value}>{cell}</td>
            );
          })}
        </tr>
      );
    })
  );
}

export default Paper;
