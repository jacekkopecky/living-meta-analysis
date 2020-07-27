import React, { useContext, useState } from 'react';
import EditContext from './EditContext';
import Popup from './Popup';

function AddPaperPopup(props) {
  const { flag } = props;
  const [popupStatus, setPopupStatus] = flag;

  const closeHandler = () => {
    setPopupStatus(!popupStatus);
  };

  if (popupStatus) {
    const content = ("Hello I'm the add paper popup");
    return (
      <Popup content={content} closingFunc={closeHandler} />
    );
  } else {
    return null;
  }
}

function AddPaper(props) {
  const { paperState } = props;
  const [papers, setPapers] = paperState;
  const edit = useContext(EditContext);
  const [popupStatus, setPopupStatus] = useState(false);

  function popupToggle() {
    setPopupStatus(!popupStatus);
  }

  if (edit.flag) {
    return (
      <>
        <button type="submit" onClick={popupToggle}>
          Add new paper
        </button>
        <AddPaperPopup flag={[popupStatus, setPopupStatus]} />
      </>
    );
  } else {
    return ('Paper');
  }
}

export default AddPaper;
