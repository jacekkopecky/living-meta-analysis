import React from 'react';
import { populateAllParsedFormulas, getDatumValue } from '../Datatools';

function Aggregates(props) {
  const {
    aggregates, columns, papers, excluded,
  } = props;
  const formulas = populateAllParsedFormulas(aggregates, columns);
  return (
    <div>
      <h1>aggregates</h1>
      <table>
        <thead>
          <tr>
            <th>Aggregates</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {formulas.map((formula, key) => {
            const value = getDatumValue(formula, undefined, undefined, papers, excluded);
            return (
              <tr>
                <td>{aggregates[key].title}</td>
                <td>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Aggregates;
