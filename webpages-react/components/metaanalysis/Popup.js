import React from 'react';

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
        { content }
      </div>
    </div>
  );
}

export default Popup;
