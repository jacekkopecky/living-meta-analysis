import React from 'react';
import { getDatumValue } from '../Datatools';

function Paper(props) {
  const { papers, paper, columnOrder, formulas, excluded } = props;
  const { title } = paper;
  const nExp = Object.keys(paper.experiments).length;

  return (
    Object.values(paper.experiments).map((exp, key) => {
      let newPaper;
      let firstTr;
      const computedValues = [];
      for (const formula of formulas) {
        computedValues.push(getDatumValue(formula, paper, exp, papers, excluded));
      }
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
          {/* computed data HERE */}
          {/*
          ON A LE JSON
          dans le json, on a columns
          dans columns, on a formula
          formula on le passe dans parseForulaString
          -> on obtient un objet col
          on prend col.formulaObj
          -
          */}
          {computedValues.map((value) => <td key={value}>{value.toFixed(3)}</td>)}

        </tr>
      );
    })
  );
}

export default Paper;
