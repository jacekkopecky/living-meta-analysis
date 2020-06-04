import React, { useState, useEffect } from 'react';
import './Editable.css';

function Editable(props) {
  const {
    children, onSave, type, edit,
  } = props;
  console.log(edit);
  const value = children;
  const [currentValue, setCurrentValue] = useState(value);
  // const [editing, setEditing] = useState(edit);

  const save = () => {
    onSave(currentValue);
    setEditing(false);
  };

  useEffect(() => {
    const keyPressHandler = (e) => {
      const { key } = e;
      switch (key) {
      case 'Enter':
        save();
        break;
      default:
        break;
      }
    };

    document.addEventListener('keydown', keyPressHandler);
    return () => {
      document.removeEventListener('keydown', keyPressHandler);
    };
  }, []);

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
  };

  return (
    edit
      ? (
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

      )
      : value
  );
}

export default Editable;
