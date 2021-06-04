import React, { useState } from 'react';
import Popup from '../Popup';

function AddGraphPopup(props) {
  const {
    graphState, columns, flag, metaanalysis, setSelectedGraph,
  } = props;
  const [graphs, setGraphs] = graphState;
  const [popupStatus, setPopupStatus] = flag;
  const modCols = columns.filter((col) => col.subType === 'moderator');
  const calcCols = columns.filter((col) => col.subType === 'calculator' || col.subType === 'calculatorN');
  const [type, setType] = useState('grape');

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  function changeType(e) {
    e.preventDefault();
    setType(e.currentTarget.value);
  }

  function formGrapeObject(elem) {
    const id = Object.keys(graphs).length;
    const [title, g1Config, g2Config, modConfig] = getGraphObject(elem);
    const graphObject = {
      formula: `grapeChartPercentGraph(${g1Config.g1},${g1Config.g1nCol},${g2Config.g2},${g2Config.g2nCol},${modConfig.mod},)`,
      formulaName: 'grapeChartPercentGraph',
      formulaObj: {
        id: 'grapeChartPercentGraph',
        label: 'Grape Chart (percentages)',
        parameters: {
          0: 'group 1 (e.g. experimental percentage)',
          1: 'group 1 N',
          2: 'group 2 (e.g. control percentage)',
          3: 'group 2 N',
          4: 'moderator',
        },
        type: {
          type: 'graph',
        },
      },
      formulaParams: [g1Config.g1Col, g1Config.g1nCol, g2Config.g2Col, g2Config.g2nCol, modConfig.modCol],
      fullLabel: `Grape Chart (percentages)( ${g1Config.g1Col.title}, ${g1Config.g1nCol.title}, ${g2Config.g2Col.title}, ${g2Config.g2nCol.title}, ${modConfig.modCol.title} )`,
      metaanalysis,
      title,
      id,
    };
    return graphObject;
  }

  function getGraphObject(elem) {
    let title;
    const g1Config = {
      g1: null,
      g1Col: null,
      g1nCol: null,
    };
    const g2Config = {
      g2: null,
      g2Col: null,
      g2nCol: null,
    };
    const modConfig = {
      mod: null,
      modCol: null,
    };
    for (const element of elem.children) {
      const input = element.children[0];
      if (input) {
        switch (input.name) {
        case 'newGraphTitle':
          title = input.value;
          break;
        case 'newGraphG1':
          g1Config.g1 = input.value;
          g1Config.g1Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g1Config.g1nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphG2':
          g2Config.g2 = input.value;
          g2Config.g2Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g2Config.g2nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphMod':
          modConfig.mod = input.value;
          modConfig.modCol = columns.filter((col) => col.subType === 'moderator' && col.id === input.value)[0];
          break;
        default:
        }
      }
    }
    return [title, g1Config, g2Config, modConfig];
  }

  function formForestObject(elem) {
    const id = Object.keys(graphs).length;

    const [title, g1Config, g2Config] = getGraphObject(elem);

    const graphObject = {
      formula: `forestPlotPercentGraph(${g1Config.g1Col.id},${g1Config.g1nCol.id},${g2Config.g2Col.id},${g2Config.g2nCol.id})`,
      formulaName: 'forestPlotPercentGraph',
      formulaObj: {
        id: 'forestPlotPercentGraph',
        label: 'Forest Plot (percentages)',
        parameters: {
          0: 'group 1 (e.g. experimental percentage)',
          1: 'group 1 N',
          2: 'group 2 (e.g. control percentage)',
          3: 'group 2 N',
        },
        type: {
          type: 'graph',
        },
      },
      formulaParams: [g1Config.g1Col, g1Config.g1nCol, g2Config.g2Col, g2Config.g2nCol],
      fullLabel: `Forest Plot (percentages)( ${g1Config.g1Col.title}, ${g1Config.g1nCol.title}, ${g2Config.g2Col.title}, ${g2Config.g2nCol.title} )`,
      metaanalysis,
      title,
      id,
    };

    return graphObject;
  }

  function formForestGroupObject(elem) {
    const id = Object.keys(graphs).length;

    const [title, g1Config, g2Config, modConfig] = getGraphObject(elem);

    const graphObject = {
      formula: `forestPlotGroupPercentGraph(${g1Config.g1Col.id},${g1Config.g1nCol.id},${g2Config.g2Col.id},${g2Config.g2nCol.id},${modConfig.modCol.id},)`,
      formulaName: 'forestPlotGroupPercentGraph',
      formulaObj: {
        id: 'forestPlotGroupPercentGraph',
        label: 'Forest Plot With Groups (percentages)',
        parameters: {
          0: 'group 1 (e.g. experimental percentage)',
          1: 'group 1 N',
          2: 'group 2 (e.g. control percentage)',
          3: 'group 2 N',
          4: 'moderator',
        },
        type: {
          type: 'graph',
        },
      },
      formulaParams: [g1Config.g1Col, g1Config.g1nCol, g2Config.g2Col, g2Config.g2nCol, modConfig.modCol],
      fullLabel: `Forest Plot Group (percentages)( ${g1Config.g1Col.title}, ${g1Config.g1nCol.title}, ${g2Config.g2Col.title}, ${g2Config.g2nCol.title}, ${modConfig.modCol.title} )`,
      metaanalysis,
      title,
      id,
    };

    return graphObject;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const formElem = e.currentTarget;
    let graph;

    switch (type) {
    case 'grape':
      graph = formGrapeObject(formElem);
      break;
    case 'forest':
      graph = formForestObject(formElem);
      break;
    case 'forestGroup':
      graph = formForestGroupObject(formElem);
      break;
    default:
    }

    if (graph && !graph.title.replace(/\s/g, '')) {
      graph.title = `Graph #${graphs.length + 1}`;
    }

    const graphsClone = [...graphs];
    graphsClone.push(graph);
    setGraphs(graphsClone);
    setSelectedGraph(graph);

    closeHandler();
  }

  const content = (
    <>
      <h1> Add a new graph </h1>
      <form className="graphForm" onSubmit={handleSubmit}>
        <label htmlFor="newGraphTitle">Title:
          <input type="text" name="newGraphTitle" placeholder="Enter a title" />
        </label>

        <label htmlFor="newGraphType">Graph type:
          <select name="newGraphType" onChange={changeType}>
            <option key="grape" value="grape" selected="selected">Grape chart</option>
            <option key="forest" value="forest">Forest plot</option>
            <option key="forestGroup" value="forestGroup">Forest plot with moderator group</option>
          </select>
        </label>

        <label htmlFor="newGraphG1">Group 1:
          <select name="newGraphG1">
            { calcCols && calcCols.map((col) => (
              <>
                { col.subType !== 'calculatorN'
                  ? (
                    <option
                      key={`newGraphG1${col.id}`}
                      value={col.id}
                    >
                      { col.title }
                    </option>
                  )
                  : null }
              </>
            )) }
          </select>
        </label>

        <label htmlFor="newGraphG2">Group 2:
          <select name="newGraphG2">
            { calcCols && calcCols.map((col) => (
              <>
                { col.subType !== 'calculatorN'
                  ? (
                    <option
                      key={`newGraphG2${col.id}`}
                      value={col.id}
                    >
                      { col.title }
                    </option>
                  )
                  : null }
              </>
            )) }
          </select>
        </label>

        { (type !== 'forest')
          ? (
            <label htmlFor="newGraphMod">Moderator:
              <select name="newGraphMod">
                { modCols && modCols.map((col) => (
                  <option
                    key={`newGraphMod${col.id}`}
                    value={col.id}
                  >
                    { col.title }
                  </option>
                )) }
              </select>
            </label>
          )
          : null }
        <input type="submit" className="graphSubmit" />
      </form>
    </>
  );

  if (popupStatus) {
    return (
      <Popup content={content} closingFunc={closeHandler} />
    );
  } else {
    return null;
  }
}

function AddGraph(props) {
  const {
    graphState, columns, metaanalysis, setSelectedGraph,
  } = props;
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  return (
    <>
      <div id="addGraphButtonContainer">
        <div role="button" type="submit" id="addGraphButton" onClick={popupToggle} onKeyDown={popupToggle} tabIndex={0}>
          Add new graph
        </div>
        <AddGraphPopup
          graphState={graphState}
          columns={columns}
          flag={[popupStatus, setPopupStatus]}
          metaanalysis={metaanalysis}
          setSelectedGraph={setSelectedGraph}
        />
      </div>
    </>
  );
}

export default AddGraph;
