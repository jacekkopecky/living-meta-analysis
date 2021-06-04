import React, { useState, useContext } from 'react';
import EditContext from '../EditContext';
import Popup from '../Popup';

function AddSimpleAnalysisPopup(props) {
  const {
    flag, formulaFunctions, columns, aggregatesState, metaanalysis,
  } = props;
  const [popupStatus, setPopupStatus] = flag;
  const [aggregates, setAggregates] = aggregatesState;
  const aggregatesClone = [...aggregates];
  const [formulaState, setFormulaState] = useState(formulaFunctions[0]);
  const numberColumns = columns.filter((col) => col.subType !== 'moderator');
  const formulaOptions = numberColumns.concat(aggregates);

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  const handleFormulaChange = (e) => {
    const formulaId = e.currentTarget.value;
    let currentFormula = { ...formulaState };
    for (let i = 0; i < formulaFunctions.length; i += 1) {
      if (formulaFunctions[i].id === formulaId) {
        currentFormula = formulaFunctions[i];
      }
    }
    setFormulaState(currentFormula);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = [];
    let title;
    for (let i = 0; i < e.currentTarget.children.length; i += 1) {
      if (e.currentTarget.children[i].classList.contains('paramSelect')) {
        const param = e.currentTarget.children[i].children[0];
        params.push(formulaOptions.filter((col) => col.title === param.value)[0]);
      }
      if (e.currentTarget.children[i].classList.contains('simpleInputTitle')) {
        title = e.currentTarget.children[i].children[0].value;
      }
    }
    if (!title) title = `Simple analysis #${aggregates.length}`;
    let newAnalysis;
    if (params.length === 1) {
      newAnalysis = {
        formula: `${formulaState.id}(${params[0].formula || params[0].id})`,
        formulaName: formulaState.id,
        formulaObj: formulaState,
        formulaParams: params,
        fullLabel: `${formulaState.label}(${params[0].formulaObj ? params[0].fullLabel : params[0].title})`,
        metaanalysis,
        title,
      };
    } else if (params.length === 2) {
      newAnalysis = {
        formula: `${formulaState.id}(${params[0].formula || params[0].id}, ${params[1].formula || params[1].id})`,
        formulaName: formulaState.id,
        formulaObj: formulaState,
        formulaParams: params,
        fullLabel: `${formulaState.label}(${params[0].formulaObj ? params[0].fullLabel : params[0].title}, ${params[1].formulaObj ? params[1].fullLabel : params[1].title})`,
        metaanalysis,
        title,
      };
    }
    aggregatesClone.unshift(newAnalysis);
    setAggregates(aggregatesClone);
    closeHandler();
  };

  const content = (
    <>
      <h1>Add new simple analysis</h1>
      <form id="simpleInputForm" onSubmit={handleSubmit}>
        <label htmlFor="simpleInputTitle" className="simpleInputTitle">Title:
          <input type="text" />
        </label>
        <label htmlFor="simpleInput">Select calculation formula:
          <select name="simpleInput" onChange={handleFormulaChange}>
            { formulaFunctions.map((formula) => (
              <option key={`simpleInput${formula.id}`} value={formula.id}>
                { formula.label }
              </option>
            )) }
          </select>
        </label>
        { formulaState.parameters.map((param) => (
          <label htmlFor={`simpleInput${formulaState.id}${param}`} key={`simpleInput${formulaState.id}${param}`} className="paramSelect">{ param }:
            <select name={`simpleInput${formulaState.id}${param}`}>
              { formulaOptions.map((col) => (
                <option key={`simpleInput${formulaState.id}${param}${col.title}`} value={col.title}>
                  { col.title }
                </option>
              )) }
            </select>
          </label>
        )) }
        <input type="submit" className="submitButton" />
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

function AddSimpleAnalysis(props) {
  const {
    formulaFunctions, columns, aggregatesState, metaanalysis,
  } = props;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <div role="button" type="submit" className="addSimpleAnalysisButton" onClick={popupToggle} onKeyDown={popupToggle} tabIndex={0}>Add new simple analysis</div>
        <AddSimpleAnalysisPopup
          flag={[popupStatus, setPopupStatus]}
          formulaFunctions={formulaFunctions}
          columns={columns}
          aggregatesState={aggregatesState}
          metaanalysis={metaanalysis}
        />
      </>
    );
  } else {
    return null;
  }
}

export default AddSimpleAnalysis;
