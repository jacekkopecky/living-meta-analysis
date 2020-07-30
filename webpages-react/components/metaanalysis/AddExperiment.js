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

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  const createNewExperiment = (experimentDetails) => {
    const newTime = new Date().getTime();
    const data = {};
    for (let i = 0; i < experimentDetails.length; i += 1) {
      data[i] = {
        ctime: newTime,
        enteredBy: currentUser.displayName,
        value: experimentDetails[i],
      };
    }
    let index;
    if (paper.experiments.length === 1) {
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
      title: experimentDetails[0],
    };
    return expObj;
  };

  const handleSubmit = (e) => {
    const experimentDetails = [];
    const children = e.target.children;
    for (let i = 0; i < children.length; i += 1) {
      const inputElem = children[i].children[0];
      if (inputElem && inputElem.value) {
        experimentDetails[i] = inputElem.value;
      } else {
        experimentDetails[i] = 'n/a';
      }
    }
    const newExperiment = createNewExperiment(experimentDetails);
    const tempPapers = [...papers];
    const paperIndex = tempPapers.indexOf(paper);
    tempPapers[paperIndex].experiments[newExperiment.index] = newExperiment;
    setPapers(tempPapers);
    console.log(paper.experiments);
    console.log(columns);
    closeHandler();
  };

  const content = (
    <div className="addExperimentPopup">
      <h1> Add an Experiment to { paper.title } </h1>
      <form className="addExperimentForm" onSubmit={handleSubmit}>
        <label key='experiment'>
          Experiment type:
          <input type="text" id="ExperimentInput" />
        </label>
        { columns.map((col) => (
          (col.type === 'characteristic')
            ? (
              <label key={col.title.replace(/\s/g, '')} >
                { col.title }:
                <input
                  type="text"
                  id={`${col.title.replace(/\s/g, '')}Input`}
                />
              </label>
            )
            : ''
        )) }
        <input type="submit" value="Submit" />
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
