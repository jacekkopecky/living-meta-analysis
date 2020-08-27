import React from 'react';

export function RemovalPopup(props) {
  const { closingFunc, removalFunc, removalText } = props;

  function removeItem() {
    removalFunc();
    closingFunc();
  }

  const content = (
    <div className="removalPopup">
      <h1>Are you sure you wish to remove { removalText }?</h1>
      <div className="removalPopupCancel" role="button" tabIndex={0} onClick={closingFunc} onKeyDown={closingFunc}>Cancel</div>
      <div className="removalPopupYes" role="button" tabIndex={0} onClick={removeItem} onKeyDown={removeItem}>Yes, remove it</div>
    </div>
  );

  return <Popup content={content} closingFunc={closingFunc} />;
}

function Popup(props) {
  const { content, closingFunc } = props;

  const closeHandler = (e) => {
    if (e.type === 'click' || e.key === ' ' || e.key === 'Enter') {
      closingFunc();
    }
  };

  return (
    <div className="popupBackground">
      <div className="popupContainer">
        <div
          className="popupClose"
          role="button"
          tabIndex="0"
          onClick={closeHandler}
          onKeyDown={closeHandler}
        >
          ×
        </div>
        <div className="popupContentWrapper">
          { content }
        </div>
      </div>
    </div>
  );
}

export default Popup;
