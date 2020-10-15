import React, { useState, useContext } from 'react';
import EditContext from './EditContext';
import './Editable.css';

const textareaExtraSize = 10;

function resizeTextArea(el) {
  if (!el) return; // ref has changed

  if (el.scrollHeight > el.clientHeight) {
    el.style.height = `${el.scrollHeight + textareaExtraSize}px`;
  }
}

function Editable(props) {
  const {
    children, onSave, type, cellId,
  } = props;
  const edit = useContext(EditContext);
  const value = children;
  const [currentValue, setCurrentValue] = useState(value);

  const handleChange = (e) => {
    if (type === 'textarea') resizeTextArea(e.target);

    if (cellId) {
      onSave(e.target.value, cellId);
    } else {
      onSave(e.target.value);
    }
    setCurrentValue(e.target.value);
  };

  if (!edit.flag) {
    return (value == null || value === '') ? 'no value' : value;
  } else {
    return (
      type === 'input'
        ? (
          <input
            type="text"
            id="value"
            name="value"
            value={currentValue || ''}
            onChange={handleChange}
          />
        )
        : (
          <textarea
            type="text"
            id="value"
            name="value"
            ref={resizeTextArea}
            onChange={handleChange}
            value={currentValue || ''}
          />
        )
    );
  }
}

export default Editable;
