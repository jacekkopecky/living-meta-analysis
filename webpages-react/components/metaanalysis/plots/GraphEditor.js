import React, { useState } from 'react';
import Popup from '../Popup';

function GrapeMenu(props) {
  const {
    graph, graphState, columns, popup,
  } = props;
  const [graphs, setGraphs] = graphState;
  const [popupStatus, setPopupStatus] = popup;
  const graphsClone = [...graphs];
  const title = graph.title;
  const params = graph.formulaParams;
  const modCols = columns.filter((col) => col.subType === 'moderator');
  const calcCols = columns.filter((col) => col.subType === 'calculator');
  const newParams = [null, null, null, null, null];
  const paramIndex = [null, null, null, null, null];
  const newColumnParams = [null, null, null, null, null];

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let formElem;
    if (e.currentTarget.nodeName === 'FORM') {
      formElem = e.currentTarget;
    } else if (e.currentTarget.nodeName === 'SELECT' || e.currentTarget.nodeName === 'INPUT') {
      formElem = e.currentTarget.parentNode.parentNode;
    }
    for (let i = 0; i < formElem.children.length; i += 1) {
      const input = formElem.children[i].children[0];
      if (input && (input.nodeName === 'INPUT' || input.nodeName === 'SELECT') && input.type !== 'submit') {
        switch (input.name) {
        case 'grapeTitle':
          if (input.value) {
            graph.title = input.value;
          }
          break;
        case 'grapeG1':
          if (params[0].id !== input.value) {
            newParams[0] = input.value;
          }
          break;
        case 'grapeG1N':
          if (params[1].id !== input.value) {
            newParams[1] = input.value;
          }
          break;
        case 'grapeG2':
          if (params[2].id !== input.value) {
            newParams[2] = input.value;
          }
          break;
        case 'grapeG2N':
          if (params[3].id !== input.value) {
            newParams[3] = input.value;
          }
          break;
        case 'grapeMod':
          if (params[4].id !== input.value) {
            newParams[4] = input.value;
          }
          break;
        default:
        }
      }
    }
    for (let i = 0; i < newParams.length; i += 1) {
      if (newParams[i]) {
        const colParam = columns.filter((col) => col.id === newParams[i] && col.type !== 'result')[0];
        graph.formulaParams[i] = colParam;
        newColumnParams[i] = colParam.title;
      }
      paramIndex[i] = (newParams[i] || graph.formulaParams[i].id);
    }
    graph.formula = `grapeChartPercentGraph(${paramIndex[0]},${paramIndex[1]},${paramIndex[2]},${paramIndex[3]},${paramIndex[4]})`;
    graph.fullLabel = `Grape chart (percentages)( ${newColumnParams[0] || graph.formulaParams[0].title}, ${newColumnParams[1] || graph.formulaParams[1].title}, ${newColumnParams[2] || graph.formulaParams[2].title}, ${newColumnParams[3] || graph.formulaParams[3].title}, ${newColumnParams[4] || graph.formulaParams[4].title})`;
    for (let i = 0; i < graphs.length; i += 1) {
      if (graphsClone[i].id === graph.id) {
        graphsClone[i] = graph;
      }
    }
    setGraphs(graphsClone);
    popupToggle();
  }

  return (
    <form className="graphForm" onSubmit={handleSubmit}>
      <label htmlFor="grapeTitle">Title:
        <input type="text" name="grapeTitle" placeholder={title} />
      </label>

      <label htmlFor="grapeG1">Group 1:
        <select name="grapeG1">
          { calcCols && calcCols.map((col) => (
            <option
              key={`grapeG1${col.id}`}
              value={col.id}
              selected={params[0] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="grapeG1N">Group 1 n:
        <select name="grapeG1N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`grapeG1N${col.id}`}
              value={col.id}
              selected={params[1] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="grapeG2">Group 2:
        <select name="grapeG2">
          { calcCols && calcCols.map((col) => (
            <option
              key={`grapeG2${col.id}`}
              value={col.id}
              selected={params[2] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="grapeG2N">Group 2 n:
        <select name="grapeG2N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`grapeG2N${col.id}`}
              value={col.id}
              selected={params[3] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="grapeMod">Moderator:
        <select name="grapeMod">
          { modCols && modCols.map((col) => (
            <option
              key={`grapeMod${col.id}`}
              value={col.id}
              selected={params[4] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>
      <input type="submit" />
    </form>
  );
}

function ForestMenu(props) {
  const {
    graph, graphState, columns, popup,
  } = props;
  const [graphs, setGraphs] = graphState;
  const [popupStatus, setPopupStatus] = popup;
  const graphsClone = [...graphs];
  const title = graph.title;
  const params = graph.formulaParams;
  const calcCols = columns.filter((col) => col.subType === 'calculator');
  const newParams = [null, null, null, null];
  const paramIndex = [null, null, null, null];
  const newColumnParams = [null, null, null, null];

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let formElem;
    if (e.currentTarget.nodeName === 'FORM') {
      formElem = e.currentTarget;
    } else if (e.currentTarget.nodeName === 'SELECT' || e.currentTarget.nodeName === 'INPUT') {
      formElem = e.currentTarget.parentNode.parentNode;
    }
    for (let i = 0; i < formElem.children.length; i += 1) {
      const input = formElem.children[i].children[0];
      if (input && (input.nodeName === 'INPUT' || input.nodeName === 'SELECT') && input.type !== 'submit') {
        switch (input.name) {
        case 'forestTitle':
          if (input.value) {
            graph.title = input.value;
          }
          break;
        case 'forestG1':
          if (params[0].id !== input.value) {
            newParams[0] = input.value;
          }
          break;
        case 'forestG1N':
          if (params[1].id !== input.value) {
            newParams[1] = input.value;
          }
          break;
        case 'forestG2':
          if (params[2].id !== input.value) {
            newParams[2] = input.value;
          }
          break;
        case 'forestG2N':
          if (params[3].id !== input.value) {
            newParams[3] = input.value;
          }
          break;
        default:
        }
      }
    }
    for (let i = 0; i < newParams.length; i += 1) {
      if (newParams[i]) {
        const colParam = columns.filter((col) => col.id === newParams[i] && col.type !== 'result')[0];
        graph.formulaParams[i] = colParam;
        newColumnParams[i] = colParam.title;
      }
      paramIndex[i] = (newParams[i] || graph.formulaParams[i].id);
    }
    graph.formula = `forestPlotPercentGraph(${paramIndex[0]},${paramIndex[1]},${paramIndex[2]},${paramIndex[3]})`;
    graph.fullLabel = `Forest plot (percentages)( ${newColumnParams[0] || graph.formulaParams[0].title}, ${newColumnParams[1] || graph.formulaParams[1].title}, ${newColumnParams[2] || graph.formulaParams[2].title}, ${newColumnParams[3] || graph.formulaParams[3].title})`;
    for (let i = 0; i < graphs.length; i += 1) {
      if (graphsClone[i].id === graph.id) {
        graphsClone[i] = graph;
      }
    }
    setGraphs(graphsClone);
    popupToggle();
  }

  return (
    <form className="graphForm" onSubmit={handleSubmit}>
      <label htmlFor="forestTitle">Title:
        <input type="text" name="forestTitle" placeholder={title} />
      </label>

      <label htmlFor="forestG1">Group 1:
        <select name="forestG1">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestG1${col.id}`}
              value={col.id}
              selected={params[0] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestG1N">Group 1 n:
        <select name="forestG1N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestG1N${col.id}`}
              value={col.id}
              selected={params[1] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestG2">Group 2:
        <select name="forestG2">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestG2${col.id}`}
              value={col.id}
              selected={params[2] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestG2N">Group 2 n:
        <select name="forestG2N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestG2N${col.id}`}
              value={col.id}
              selected={params[3] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>
      <input type="submit" />
    </form>
  );
}

function ForestGroupMenu(props) {
  const {
    graph, graphState, columns, popup,
  } = props;
  const [graphs, setGraphs] = graphState;
  const [popupStatus, setPopupStatus] = popup;
  const graphsClone = [...graphs];
  const title = graph.title;
  const params = graph.formulaParams;
  const modCols = columns.filter((col) => col.subType === 'moderator');
  const calcCols = columns.filter((col) => col.subType === 'calculator');
  const newParams = [null, null, null, null, null];
  const paramIndex = [null, null, null, null, null];
  const newColumnParams = [null, null, null, null, null];

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let formElem;
    if (e.currentTarget.nodeName === 'FORM') {
      formElem = e.currentTarget;
    } else if (e.currentTarget.nodeName === 'SELECT' || e.currentTarget.nodeName === 'INPUT') {
      formElem = e.currentTarget.parentNode.parentNode;
    }
    for (let i = 0; i < formElem.children.length; i += 1) {
      const input = formElem.children[i].children[0];
      if (input && (input.nodeName === 'INPUT' || input.nodeName === 'SELECT') && input.type !== 'submit') {
        switch (input.name) {
        case 'forestGroupTitle':
          if (input.value) {
            graph.title = input.value;
          }
          break;
        case 'forestGroupG1':
          if (params[0].id !== input.value) {
            newParams[0] = input.value;
          }
          break;
        case 'forestGroupG1N':
          if (params[1].id !== input.value) {
            newParams[1] = input.value;
          }
          break;
        case 'forestGroupG2':
          if (params[2].id !== input.value) {
            newParams[2] = input.value;
          }
          break;
        case 'forestGroupG2N':
          if (params[3].id !== input.value) {
            newParams[3] = input.value;
          }
          break;
        case 'forestGroupMod':
          if (params[4].id !== input.value) {
            newParams[4] = input.value;
          }
          break;
        default:
        }
      }
    }
    for (let i = 0; i < newParams.length; i += 1) {
      if (newParams[i]) {
        const colParam = columns.filter((col) => col.id === newParams[i] && col.type !== 'result')[0];
        graph.formulaParams[i] = colParam;
        newColumnParams[i] = colParam.title;
      }
      paramIndex[i] = (newParams[i] || graph.formulaParams[i].id);
    }
    graph.formula = `forestPlotGroupPercentGraph(${paramIndex[0]},${paramIndex[1]},${paramIndex[2]},${paramIndex[3]},${paramIndex[4]})`;
    graph.fullLabel = `Forest Plot Group (percentages)( ${newColumnParams[0] || graph.formulaParams[0].title}, ${newColumnParams[1] || graph.formulaParams[1].title}, ${newColumnParams[2] || graph.formulaParams[2].title}, ${newColumnParams[3] || graph.formulaParams[3].title}, ${newColumnParams[4] || graph.formulaParams[4].title})`;
    for (let i = 0; i < graphs.length; i += 1) {
      if (graphsClone[i].id === graph.id) {
        graphsClone[i] = graph;
      }
    }
    setGraphs(graphsClone);
    popupToggle();
  }

  return (
    <form className="graphForm" onSubmit={handleSubmit}>
      <label htmlFor="forestGroupTitle">Title:
        <input type="text" name="forestGroupTitle" placeholder={title} />
      </label>

      <label htmlFor="forestGroupG1">Group 1:
        <select name="forestGroupG1">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestGroupG1${col.id}`}
              value={col.id}
              selected={params[0] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestGroupG1N">Group 1 n:
        <select name="forestGroupG1N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestGroupG1N${col.id}`}
              value={col.id}
              selected={params[1] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestGroupG2">Group 2:
        <select name="forestGroupG2">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestGroupG2${col.id}`}
              value={col.id}
              selected={params[2] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestGroupG2N">Group 2 n:
        <select name="forestGroupG2N">
          { calcCols && calcCols.map((col) => (
            <option
              key={`forestGroupG2N${col.id}`}
              value={col.id}
              selected={params[3] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>

      <label htmlFor="forestGroupMod">Moderator:
        <select name="forestGroupMod">
          { modCols && modCols.map((col) => (
            <option
              key={`forestGroupMod${col.id}`}
              value={col.id}
              selected={params[4] === col ? 'selected' : null}
            >
              { col.title }
            </option>
          )) }
        </select>
      </label>
      <input type="submit" />
    </form>
  );
}

function GraphEditor(props) {
  const { graph, graphState, columns } = props;
  const [popupStatus, setPopupStatus] = useState(false);
  let content;

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  switch (graph.formulaName) {
  case 'grapeChartPercentGraph':
    content = (
      <GrapeMenu
        graph={graph}
        graphState={graphState}
        columns={columns}
        popup={[popupStatus, setPopupStatus]}
      />
    );
    break;
  case 'forestPlotPercentGraph':
    content = (
      <ForestMenu
        graph={graph}
        graphState={graphState}
        columns={columns}
        popup={[popupStatus, setPopupStatus]}
      />
    );
    break;
  case 'forestPlotGroupPercentGraph':
    content = (
      <ForestGroupMenu
        graph={graph}
        graphState={graphState}
        columns={columns}
        popup={[popupStatus, setPopupStatus]}
      />
    );
    break;
  default:
  }

  return (
    <>
      <div id="editGraphButtonContainer">
        <div role="button" type="submit" id="editGraphButton" onClick={popupToggle} onKeyDown={popupToggle} tabIndex={0}>
          Edit this graph
        </div>
        { popupStatus
          ? (
            <Popup content={content} closingFunc={popupToggle} />
          )
          : null }
      </div>
    </>
  );
}

export default GraphEditor;
