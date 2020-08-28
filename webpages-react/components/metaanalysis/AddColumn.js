import React, { useContext, useState } from 'react';
import EditContext from './EditContext';
import formulas from './aggregates/Formulas';
import Popup from './Popup';

function AddColumnPopup(props) {
  const { flag, columnState } = props;
  const [columns, setColumns] = columnState;
  const [popupStatus, setPopupStatus] = flag;
  const [selectedType, setSelectedType] = useState('moderator');
  const simpleFormulas = formulas().simpleFormulas;
  const [selectedFormula, setSelectedFormula] = useState(simpleFormulas[0]);
  const calculators = columns.filter((col) => col.subType === 'calculator');

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
    setSelectedType('moderator');
  };

  function handleTypeChange(e) {
    setSelectedType(e.currentTarget.value);
  }

  function handleFormulaChange(e) {
    let newFormula = simpleFormulas[0];
    for (let i = 0; i < simpleFormulas.length; i += 1) {
      if (simpleFormulas[i].id === e.currentTarget.value) {
        newFormula = simpleFormulas[i];
      }
    }
    setSelectedFormula(newFormula);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let title;
    let type;
    let formulaTitle;
    let params = [];
    let columnsClone = [...columns];

    const reorderColumnsBySubtype = (cols) => {
      const colsClone = [...cols];
      const modCols = [];
      const calcCols = [];
      const dataCols = [];
      colsClone.forEach((column) => {
        if (column.subType === 'moderator') {
          modCols.push(column);
        } else if (column.subType === 'calculator') {
          calcCols.push(column);
        } else if (column.subType === 'result') {
          dataCols.push(column);
        }
      });
      const orderedCols = modCols.concat(calcCols.concat(dataCols));
      return orderedCols;
    };

    for (let i = 0; i < e.currentTarget.children.length; i += 1) {
      if (e.currentTarget.children[i].nodeName === 'LABEL' || e.currentTarget.children[i].nodeName === 'DIV') {
        const input = e.currentTarget.children[i];
        switch (input.id) {
        case 'columnTitleInput':
          title = input.children[0].value;
          break;
        case 'columnTypeSelect':
          type = input.children[0].value;
          break;
        case 'columnFormulaSelect':
          formulaTitle = input.children[0].value;
          break;
        case 'formulaParamInput':
          for (let j = 0; j < input.children.length; j += 1) {
            params.push(input.children[j].children[0].value);
          }
          break;
        default:
        }
      }
    }
    const f = simpleFormulas.filter((formula) => formula.id === formulaTitle)[0];
    const formulaClone = { ...f };
    formulaClone.type = window.lima.FORMULA_TYPE;

    let newColumnObject;
    if (type !== 'result') {
      const newId = String(columns.filter((col) => col.subType !== 'result').length + 1);
      const newInputType = type === 'moderator' ? 'string' : 'number';
      newColumnObject = {
        id: newId,
        inputType: newInputType,
        sourceColumnMap: {},
        subType: type,
        title,
        type: 'characteristic',
      };
    } else {
      const newNumber = String(columns.filter((col) => col.subType === 'result').length + 1);
      let newFormula = '';
      const newFormulaParams = [];
      let newFullLabel = '';
      for (let i = 0; i < params.length; i += 1) {
        newFormulaParams[i] = calculators.filter((col) => col.id === String(params[i]))[0];
        newFullLabel = newFullLabel.concat(newFormulaParams[i].title);
        newFormula = newFormula.concat(params[i]);
        if (params[i + 1]) {
          newFormula = newFormula.concat(',');
          newFullLabel = newFullLabel.concat(', ');
        }
      }
      newColumnObject = {
        formula: `${formulaClone.id}(${newFormula})`,
        formulaName: formulaClone.id,
        formulaObj: formulaClone,
        formulaParams: newFormulaParams,
        fullLabel: `${formulaClone.label}(${newFullLabel})`,
        metaanalysis: window.currentMa,
        number: newNumber,
        subType: type,
        title,
        type,
      };
    }
    if (newColumnObject !== {} && title !== '') {
      columnsClone.push(newColumnObject);
      columnsClone = reorderColumnsBySubtype(columnsClone);
      closeHandler();
    }
    setColumns(columnsClone);
  }

  const content = (
    <div className="AddColumnPopup">
      <h1>Add a new column</h1>
      <form className="addColumnForm" onSubmit={handleSubmit}>
        <label htmlFor="columnTitleInput" id="columnTitleInput">
          Title:
          <input
            type="text"
            name="columnTitleInput"
            placeholder="Enter a title for the column (required)"
          />
        </label>
        <label htmlFor="columnTypeSelect" id="columnTypeSelect">
          <select name="columnTypeSelect" onChange={handleTypeChange}>Column type:
            <option value="moderator">Moderator</option>
            <option value="calculator">Calculator</option>
            <option value="result">Result</option>
          </select>
        </label>
        { selectedType === 'result'
          ? (
            <>
              <label htmlFor="columnFormulaSelect" id="columnFormulaSelect">
                <select name="columnFormulaSelect" onChange={handleFormulaChange}>
                  { simpleFormulas.map((formula) => (
                    <option key={`column${formula.id}`} value={formula.id} selected={selectedFormula.id === formula.id ? 'selected' : null}>
                      { formula.label }
                    </option>
                  )) }
                </select>
              </label>
              <div id="formulaParamInput">
                { selectedFormula.parameters.map((param) => (
                  <label htmlFor={`param${param}`} key={`param${param}`} className="formulaParamInput">{ param }:
                    <select name={`param${param}`}>
                      { calculators.map((col) => (
                        <option value={col.id} key={`param${param}${col.id}`}>
                          { col.title }
                        </option>
                      )) }
                    </select>
                  </label>
                )) }
              </div>
            </>
          )
          : null }
        <input type="submit" className="submitButton" />
      </form>
    </div>
  );

  if (popupStatus) {
    return (
      <Popup content={content} closingFunc={closeHandler} />
    );
  } else {
    return null;
  }
}

function AddColumn(props) {
  const { columnState, aggregates } = props;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <div id="addColumnButtonContainer">
          <button type="submit" id="addColumnButton" onClick={popupToggle}>
            Add new column
          </button>
          <AddColumnPopup
            flag={[popupStatus, setPopupStatus]}
            columnState={columnState}
            aggregates={aggregates}
          />
        </div>
      </>
    );
  } else {
    return null;
  }
}

export default AddColumn;
