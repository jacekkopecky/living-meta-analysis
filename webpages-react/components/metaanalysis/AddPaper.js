import React, { useContext, useState } from 'react';
import EditContext from './EditContext';
import UserContext from './UserContext';
import Popup from './Popup';

function AddPaperPopup(props) {
  const {
    flag, paperState, paperOrderValue, metaanalysis,
  } = props;
  const [popupStatus, setPopupStatus] = flag;
  const [papers, setPapers] = paperState;
  const [paperOrder, setPaperOrder] = paperOrderValue;
  const currentUser = useContext(UserContext);

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  const createDefaultExperiment = (paperDetails, newTime) => {
    const expObj = {
      ctime: newTime,
      data: {},
      enteredBy: currentUser.displayName,
      index: 0,
      paper: null,
      title: null,
    };
    return expObj;
  };

  const createNewPaper = (paperDetails) => {
    const newTime = new Date().getTime();
    const newId = `id/p/${String(Math.floor(Math.random() * 1000000000000))}`;
    const newTitle = paperDetails.paperInput;
    const newRef = paperDetails.referenceInput;
    let newDesc;
    if (paperDetails.descriptionInput) {
      newDesc = paperDetails.descriptionInput;
    } else {
      newDesc = null;
    }
    let newLink;
    if (paperDetails.linkInput) {
      newLink = paperDetails.linkInput;
    } else {
      newLink = null;
    }
    let newDoi;
    if (paperDetails.doiInput) {
      newDoi = paperDetails.doiInput;
    } else {
      newDoi = null;
    }
    const experiment = createDefaultExperiment(paperDetails, newTime);

    const paperObj = {
      apiurl: '',
      columns: [],
      ctime: newTime,
      enteredBy: currentUser.displayName,
      experiments: [experiment],
      hiddenCols: [],
      id: newId,
      metaanalysis,
      mtime: newTime,
      tags: [],
      title: newTitle,
      reference: newRef,
      description: newDesc,
      link: newLink,
      doi: newDoi,
    };
    return paperObj;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const paperDetails = {
      paperInput: null,
      referenceInput: null,
      descriptionInput: null,
      linkInput: null,
      doiInput: null,
    };
    const children = e.target.children;
    for (let i = 0; i < children.length; i += 1) {
      const inputElem = children[i].children[0];
      if (inputElem && inputElem.value) {
        paperDetails[inputElem.id] = inputElem.value;
      }
    }
    if (paperDetails.paperInput && paperDetails.referenceInput) {
      const newPaper = createNewPaper(paperDetails);
      newPaper.experiments[0].paper = newPaper;
      setPaperOrder([newPaper.id, ...paperOrder]);
      setPapers([newPaper, ...papers]);
      closeHandler();
    }
  };

  const content = (
    <div className="addPaperPopup">
      <h1> Add a new paper </h1>
      <form className="addPaperForm" onSubmit={handleSubmit}>
        <label htmlFor="paperInput">
          Paper*:
          <input
            type="text"
            id="paperInput"
            placeholder="Enter a shortname for the paper"
          />
        </label>
        <label htmlFor="referenceInput">
          Reference*:
          <input
            type="text"
            id="referenceInput"
            placeholder="Author, year, title, journal etc"
          />
        </label>
        <label htmlFor="descriptionInput">
          Description:
          <input
            type="textarea"
            id="descriptionInput"
            placeholder="Enter a description of the paper"
          />
        </label>
        <label htmlFor="linkInput">
          Link:
          <input
            type="text"
            id="linkInput"
            placeholder="Enter a URL for the paper"
          />
        </label>
        <label htmlFor="doiInput">
          DOI:
          <input
            type="text"
            id="doiInput"
            placeholder="Enter a DOI for the paper"
          />
        </label>
        <input type="submit" value="Submit" className="submitButton" />
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

function AddPaper(props) {
  const { paperState, paperOrderValue, metaanalysis } = props;
  const [papers, setPapers] = paperState;
  const [paperOrder, setPaperOrder] = paperOrderValue;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <div id="addPaperButtonContainer">
          <button type="submit" id="addPaperButton" onClick={popupToggle}>
            Add new paper
          </button>
          <AddPaperPopup
            flag={[popupStatus, setPopupStatus]}
            paperState={[papers, setPapers]}
            paperOrderValue={[paperOrder, setPaperOrder]}
            metaanalysis={metaanalysis}
          />
        </div>
      </>
    );
  } else {
    return ('Paper');
  }
}

export default AddPaper;
