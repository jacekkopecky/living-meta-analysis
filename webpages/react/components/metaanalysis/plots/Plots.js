import React from 'react';
import ForestPlots from './ForestPlots';
import './Plots.css';

function Plots(props) {
  const { graphs } = props;
  return (
    <>
      {graphs.map((graph) => (
        // if ......
        <ForestPlots forestPlots={graph} />
      ))}

    </>
  );
}

export default Plots;
