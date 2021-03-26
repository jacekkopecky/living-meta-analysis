import React, { useState, useContext } from 'react';
import EditContext from '../EditContext';
import Popup from '../Popup';

function AddAnalysisPopup(props) {
  const {
    flag, formulaFunctions, columns, aggregatesState, metaanalysis, type,
  } = props;
  const [popupStatus, setPopupStatus] = flag;
  const [aggregates, setAggregates] = aggregatesState;
  const aggregatesClone = [...aggregates];
  const [formulaState, setFormulaState] = useState(formulaFunctions[0]);
  const numberColumns = columns.filter((col) => col.subType !== type);
  const formulaOptions = numberColumns.concat(aggregates);

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  const handleFormulaChange = (e) => {
    const formulaId = e.currentTarget.value;
    let currentFormula = { ...formulaState };
    for (const formula of formulaFunctions) {
      if (formula.id === formulaId) {
        currentFormula = formula;
      }
    }
    setFormulaState(currentFormula);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = [];
    let title;
    for (const target of e.currentTarget) {
      if (target.children.classList.contains('paramSelect')) {
        const param = target.children.children[0];
        params.push(formulaOptions.filter((col) => col.title === param.value)[0]);
      }
      if (target.children.classList.contains('inputTitle')) {
        title = target.children.children[0].value;
      }
    }
    if (!title) title = `${type} analysis #${aggregates.length + 1}`;
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
      <h1>Add new { type } analysis</h1>
      <form id="inputForm" onSubmit={handleSubmit}>
        <label htmlFor="inputTitle" className="inputTitle">Title:
          <input type="text" />
        </label>
        <label htmlFor="input">Select calculation formula:
          <select name="input" onChange={handleFormulaChange}>
            { formulaFunctions.map((formula) => (
              <option key={`input${formula.id}`} value={formula.id}>
                { formula.label }
              </option>
            )) }
          </select>
        </label>
        { formulaState.parameters.map((param) => (
          <label htmlFor={`input${formulaState.id}${param}`} key={`input${formulaState.id}${param}`} className="paramSelect">{ param }:
            <select name={`input${formulaState.id}${param}`}>
              { formulaOptions.map((col) => (
                <option key={`input${formulaState.id}${param}${col.title}`} value={col.title}>
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

function AddAnalysis(props) {
  const {
    formulaFunctions, columns, aggregatesState, metaanalysis, type,
  } = props;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <div role="button" type="submit" className="addAnalysisButton" onClick={popupToggle} onKeyDown={popupToggle} tabIndex={0}>Add new { type } analysis</div>
        <AddAnalysisPopup
          flag={[popupStatus, setPopupStatus]}
          formulaFunctions={formulaFunctions}
          columns={columns}
          aggregatesState={aggregatesState}
          metaanalysis={metaanalysis}
          type={type}
        />
      </>
    );
  } else {
    return null;
  }
}

export default AddAnalysis;
