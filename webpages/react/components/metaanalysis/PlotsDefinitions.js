import React from 'react';
import './PlotsDefinitions.css';

function PlotsDefinitions({ graphs }) {
  return (
    <section className="plots-definitions">
      <h2>Graphs :</h2>
      <table>
        {graphs.map((graph) => (
          <tr key={graph.title}>
            <td>
              {graph.title}
            </td>
          </tr>
        ))}
      </table>
    </section>
  );
}

export default PlotsDefinitions;
