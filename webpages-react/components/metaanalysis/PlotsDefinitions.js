import React from 'react';
import './PlotsDefinitions.css';

const graphDetails = (graph) => (
  <>
    <p>{ graph.title || 'no title' }</p>
    <p>{ graph.fullLabel }</p>
  </>
);

function PlotsDefinitions(props) {
  const { graphs, makeClickable } = props;
  return (
    <section className="plots-definitions">
      <h2>Graphs :</h2>
      <table>
        <thead>
          <tr>
            <th>Plots Definitions</th>
          </tr>
        </thead>
        <tbody>
          { graphs.map((graph) => (
            <tr key={graph.fullLabel}>
              <td {...makeClickable(graph.fullLabel, graphDetails(graph))}>
                { graph.title || graph.fullLabel }
              </td>
            </tr>
          )) }
        </tbody>
      </table>
    </section>
  );
}

export default PlotsDefinitions;
