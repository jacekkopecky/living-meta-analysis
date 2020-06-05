import React, { useState } from 'react';
import './Editable.css';

function Editable(props) {
  const {
    children, onSave, type, edit, cellId,
  } = props;
  const value = children;
  const [currentValue, setCurrentValue] = useState(value);

  // const save = () => {
  //   console.log(currentValue);
  //   onSave(currentValue);
  // };

  // useEffect(() => {
  //   const keyPressHandler = (e) => {
  //     const { key } = e;
  //     switch (key) {
  //     case 'Enter':
  //       save();
  //       break;
  //     default:
  //       break;
  //     }
  //   };

  //   document.addEventListener('keydown', keyPressHandler);
  //   return () => {
  //     document.removeEventListener('keydown', keyPressHandler);
  //   };
  // }, []);

  const handleChange = (e) => {
    cellId ? onSave(e.target.value, cellId) : onSave(e.target.value);
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
