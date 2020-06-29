import React, { useState, useContext } from 'react';
import EditContext from './EditContext';
import './Editable.css';

function Editable(props) {
  const {
    children, onSave, type, cellId,
  } = props;
  const edit = useContext(EditContext);
  const value = children;
  const [currentValue, setCurrentValue] = useState(value);

  const handleChange = (e) => {
    if (cellId) {
      onSave(e.target.value, cellId);
    } else {
      onSave(e.target.value);
    }
    setCurrentValue(e.target.value);
  };

  if (edit) {
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
            onChange={handleChange}
            value={currentValue || ''}
          />
        )
    );
  }
  return value;
}

export default Editable;
