import React, { useContext, useState } from 'react';
import EditContext from './EditContext';
import UserContext from './UserContext';
import Popup from './Popup';

let [papers, setPapers] = useState(false);
let [popupStatus, setPopupStatus] = useState(false);
let flag;
let paper;
let columns;
let paperState;
let correctInputTypes = true;
const currentUser = useContext(UserContext);

const closeHandler = () => {
  setPopupStatus(!popupStatus);
};

const createNewExperiment = (experimentDetails) => {
  const newTime = new Date().getTime();
  const data = {};
  for (const col of paper.columns) {
    for (const exp of experimentDetails) {
      if (exp[1] === col.id) {
        data[col.id] = {
          ctime: newTime,
          enteredBy: currentUser.displayName,
          value: exp[0],
        };
      }
    }
  }
  for (const col of paper.columns) {
    if (!data[col.id]) {
      data[col.id] = null;
    }
  }
  let index;
  if (paper.experiments.length === 1 && paper.experiments[0].title === null) {
    index = 0;
  } else {
    index = paper.experiments.length;
  }
  const expObj = {
    ctime: newTime,
    data,
    enteredBy: currentUser.displayName,
    index,
    paper,
    title: experimentDetails[0][0],
  };
  return expObj;
};

const handleSubmit = (e) => {
  const experimentDetails = [];
  const children = e.target.children;
  for (let i = 0; i < children.length; i += 1) {
    const inputElem = children[i].children[0];
    if (inputElem) {
      const colID = inputElem.getAttribute('columnid');
      const inputType = inputElem.getAttribute('inputtype');
      if (inputElem.value && inputType === 'number') {
        experimentDetails[i] = [inputElem.value, colID];
        if (!parseInt(inputElem.value, 10)) {
          correctInputTypes = false;
        }
      } else {
        experimentDetails[i] = [null, colID];
      }
    }
  }
  const tempPapers = [...papers];
  if (correctInputTypes) {
    const newExperiment = createNewExperiment(experimentDetails);
    if (newExperiment.title) {
      const paperIndex = tempPapers.indexOf(paper);
      tempPapers[paperIndex].experiments[newExperiment.index] = newExperiment;
      closeHandler();
    }
  } else {
    e.target.nextSibling.textContent = 'Ensure correct input types';
  }
  setPapers(tempPapers);
};

function AddExperimentPopup(props) {
  [flag, paper, columns, paperState] = props;
  [popupStatus, setPopupStatus] = flag;
  [papers, setPapers] = paperState;

  const content = (
    <div className="addExperimentPopup">
      <h1> Add an Experiment to { paper.title } </h1>
      <form className="addExperimentForm" onSubmit={handleSubmit}>
        <label htmlFor="ExperimentInput" key="experiment">
          Experiment type (string) (required):
          <input type="text" id="ExperimentInput" columnid="experiment" />
        </label>
        { columns && columns.map((col) => (
          (col.type === 'characteristic' && col.sourceColumnMap[paper.id])
            ? (
              <label htmlFor={`${col.title.replace(/\s/g, '')}Input`} key={`labelFor${col.id}`}>
                { col.title } ({ col.inputType }):
                <input
                  type="text"
                  id={`${col.title.replace(/\s/g, '')}Input`}
                  columnid={col.sourceColumnMap[paper.id]}
                  inputtype={col.inputType}
                />
              </label>
            )
            : null
        )) }
        <input type="submit" value="Submit" className="submitButton" />
      </form>
      <p className="popupWarn" />
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

function AddExperiment(props) {
  [paper, columns, paperState] = props;
  const edit = useContext(EditContext);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <button type="submit" className="addExperimentButton" onClick={popupToggle}> + </button>
        <AddExperimentPopup
          flag={[popupStatus, setPopupStatus]}
          paper={paper}
          columns={columns}
          paperState={paperState}
        />
      </>
    );
  } else {
    return null;
  }
}

export default AddExperiment;
