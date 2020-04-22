import React from 'react';

function Paper(props) {
  const { data } = props;
  const { columnOrder } = data;

  return (
    data.experiments.map((exp, key) => {
      // we'll create a td element only when the row is a new paper
      let newPaper;
      if (key === 0) {
        newPaper = (
          <td rowSpan={data.nExp}>
            {data.title}
          </td>
        );
      }
      return (
        <tr key={exp.ctime + data.id}>
          {newPaper}
          <td>
            {exp.title}
          </td>
          {columnOrder.map((value) => {
            const index = exp.index.indexOf(value);
            return (
              <td key={value}>{exp.values[index]}</td>
            );
          })}
        </tr>
      );
    })
  );
}

export default Paper;
