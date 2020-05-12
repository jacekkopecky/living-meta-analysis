import React from 'react';
import SimpleForestPlots from './SimpleForestPlots';
import GroupingForestPlots from './GroupingForestPlots';
import { getSimpleForestPlotData } from '../../../tools/graphtools';
import './Plots.css';


function Plots(props) {
  const { graphs } = props;
  return (
    <>
      {graphs.map((graph) => {
        const { formulaName } = graph;
        if (formulaName === 'forestPlotPercentGraph') {
          getSimpleForestPlotData(graph);
          return <SimpleForestPlots forestPlots={graph} />;
        }
        // if (formulaName === 'forestPlotGroupPercentGraph') {
        //   return <GroupingForestPlots forestPlots={graph} />;
        // }
      })}

    </>
  );
}

export default Plots;
