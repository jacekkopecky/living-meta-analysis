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
    let title;
    let g1;
    let g1Col;
    let g1n;
    let g1nCol;
    let g2;
    let g2Col;
    let g2n;
    let g2nCol;
    let mod;
    let modCol;
    const id = Object.keys(graphs).length;

    for (let i = 0; i < elem.children.length; i += 1) {
      const input = elem.children[i].children[0];
      if (input) {
        switch (input.name) {
        case 'newGraphTitle':
          title = input.value;
          break;
        case 'newGraphG1':
          g1 = input.value;
          g1Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g1nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphG2':
          g2 = input.value;
          g2Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g2nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphMod':
          mod = input.value;
          modCol = columns.filter((col) => col.subType === 'moderator' && col.id === input.value)[0];
          break;
        default:
        }
      }
    }

    const graphObject = {
      formula: `grapeChartPercentGraph(${g1},${g1n},${g2},${g2n},${mod},)`,
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
      formulaParams: [g1Col, g1nCol, g2Col, g2nCol, modCol],
      fullLabel: `Grape Chart (percentages)( ${g1Col.title}, ${g1nCol.title}, ${g2Col.title}, ${g2nCol.title}, ${modCol.title} )`,
      metaanalysis,
      title,
      id,
    };

    return graphObject;
  }

  function formForestObject(elem) {
    let title;
    let g1Col;
    let g1nCol;
    let g2Col;
    let g2nCol;
    const id = Object.keys(graphs).length;

    for (let i = 0; i < elem.children.length; i += 1) {
      const input = elem.children[i].children[0];
      if (input) {
        switch (input.name) {
        case 'newGraphTitle':
          title = input.value;
          break;
        case 'newGraphG1':
          g1Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g1nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphG2':
          g2Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g2nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        default:
        }
      }
    }

    const graphObject = {
      formula: `forestPlotPercentGraph(${g1Col.id},${g1nCol.id},${g2Col.id},${g2nCol.id})`,
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
      formulaParams: [g1Col, g1nCol, g2Col, g2nCol],
      fullLabel: `Forest Plot (percentages)( ${g1Col.title}, ${g1nCol.title}, ${g2Col.title}, ${g2nCol.title} )`,
      metaanalysis,
      title,
      id,
    };

    return graphObject;
  }

  function formForestGroupObject(elem) {
    let title;
    let g1Col;
    let g1nCol;
    let g2Col;
    let g2nCol;
    let modCol;
    const id = Object.keys(graphs).length;

    for (let i = 0; i < elem.children.length; i += 1) {
      const input = elem.children[i].children[0];
      if (input) {
        switch (input.name) {
        case 'newGraphTitle':
          title = input.value;
          break;
        case 'newGraphG1':
          g1Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g1nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphG2':
          g2Col = columns.filter((col) => col.subType === 'calculator' && col.id === input.value)[0];
          g2nCol = columns.filter((col) => col.subType === 'calculatorN' && col.id === columns.filter((column) => column.subType === 'calculator' && column.id === input.value)[0].linkedN)[0];
          break;
        case 'newGraphMod':
          modCol = columns.filter((col) => col.subType === 'moderator' && col.id === input.value)[0];
          break;
        default:
        }
      }
    }

    const graphObject = {
      formula: `forestPlotGroupPercentGraph(${g1Col.id},${g1nCol.id},${g2Col.id},${g2nCol.id},${modCol.id},)`,
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
      formulaParams: [g1Col, g1nCol, g2Col, g2nCol, modCol],
      fullLabel: `Forest Plot Group (percentages)( ${g1Col.title}, ${g1nCol.title}, ${g2Col.title}, ${g2nCol.title}, ${modCol.title} )`,
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
