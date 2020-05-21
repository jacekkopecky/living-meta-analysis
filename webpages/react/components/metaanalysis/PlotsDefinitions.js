import React from 'react';
import './PlotsDefinitions.css';

function PlotsDefinitions({ graphs }) {
  return (
    <section className="plots-definitions">
      <h2>Graphs :</h2>
      <table>
        <thead>
          <th>Plots Definitions</th>
        </thead>
        <tbody>
          {graphs.map((graph) => (
            <tr key={graph.title}>
              <td>
                {graph.title}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default PlotsDefinitions;