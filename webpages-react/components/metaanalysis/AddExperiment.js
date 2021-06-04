import React, { useContext, useState } from 'react';
import EditContext from './EditContext';
import UserContext from './UserContext';
import Popup from './Popup';

function AddExperimentPopup(props) {
  const {
    flag, paper, columns, paperState,
  } = props;
  const [popupStatus, setPopupStatus] = flag;
  const [papers, setPapers] = paperState;
  const currentUser = useContext(UserContext);
  let correctInputTypes = true;

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  const createNewExperiment = (experimentDetails) => {
    const newTime = new Date().getTime();
    const data = {};
    for (let i = 0; i < paper.columns.length; i += 1) {
      for (let j = 0; j < experimentDetails.length; j += 1) {
        if (experimentDetails[j][1] === paper.columns[i].id) {
          data[paper.columns[i].id] = {
            ctime: newTime,
            enteredBy: currentUser.displayName,
            value: experimentDetails[j][0],
          };
        }
      }
    }
    for (let i = 0; i < paper.columns.length; i += 1) {
      if (!data[paper.columns[i].id]) {
        data[paper.columns[i].id] = null;
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
        if (inputElem.value) {
          experimentDetails[i] = [inputElem.value, colID];
          if (inputType === 'number') {
            if (!parseInt(inputElem.value, 10)) {
              correctInputTypes = false;
            }
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
  const { paper, columns, paperState } = props;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

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
