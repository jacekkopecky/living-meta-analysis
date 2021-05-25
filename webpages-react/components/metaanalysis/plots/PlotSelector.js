import React, { useState, useContext } from 'react';
import GraphEditor from './GraphEditor';
import AddGraph from './AddGraph';
import Plots from './Plots';
import EditContext from '../EditContext';
import { RemovalPopup } from '../Popup';
import './Plots.css';

function PlotSelector(props) {
  const { graphState, columns, metaanalysis } = props;
  const [graphs, setGraphs] = graphState;
  const [selectedGraph, setSelectedGraph] = useState(graphs[0]);
  const [popupStatus, setPopupStatus] = useState(false);
  const edit = useContext(EditContext);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function removeGraph() {
    const graphsClone = [...graphs];
    graphsClone.splice(graphsClone.indexOf(selectedGraph), 1);

    setGraphs(graphsClone);
    setSelectedGraph(graphsClone[0]);
  }

  function handleGraphChange(e) {
    let graph = graphs[0];
    for (const g of graphs) {
      if (g.id === Number(e.currentTarget.value)) {
        graph = g;
      }
    }
    setSelectedGraph(graph);
  }

  let showRemovalPopup = null;
  if (popupStatus) {
    showRemovalPopup = (
      <RemovalPopup
        closingFunc={popupToggle}
        removalFunc={removeGraph}
        removalText={selectedGraph.title}
      />
    );
  }

  let showSelectedGraph = null;
  if (selectedGraph && graphs !== {}) {
    showSelectedGraph = (
      <>
        <GraphEditor
          graph={selectedGraph}
          graphState={graphState}
          columns={columns}
        />
        <div
          className="removeGraphButton"
          role="button"
          tabIndex={0}
          onClick={popupToggle} 
          onKeyDown={popupToggle}
        >
          Remove
        </div>
        { showRemovalPopup }
      </>
    );
  }

  let addGraph = null;
  if (edit.flag) {
    addGraph = (
      <div id="graphButtonContainer">
        <AddGraph
          graphState={graphState}
          columns={columns}
          metaanalysis={metaanalysis}
          setSelectedGraph={setSelectedGraph}
        />
        { showSelectedGraph }
      </div>
    );
  }

  return (
    <>
      <div id="plotContainer">
        <div id="graphSelectionContainer">
          <label htmlFor="plotSelect" id="plotSelect"> Select a graph
            <select name="plotSelect" id="plotSelect" onChange={handleGraphChange}>
              { graphs.map((graph) => (
                <option value={graph.id} key={graph.id} selected={graph === selectedGraph ? 'selected' : null}>{ graph.title }</option>
              )) }
            </select>
          </label>
          { addGraph }
        </div>
        <div id="graphContainer">
          { selectedGraph && graphs !== {}
            ? (
              <div id="graphSVGContainer">
                <Plots selectedGraph={selectedGraph} />
              </div>
            )
            : null }
        </div>
      </div>
    </>
  );
}

export default PlotSelector;
