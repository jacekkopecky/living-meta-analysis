import React, { useState } from 'react';
import './Editable.css';

export default function HookEditable(WrappedComponent) {
  return (props) => {
    const [value, setValue] = useState(props.value);
    const [editing, setEditing] = useState(true);

    const handleChange = (e) => {
      setValue(e.target.value);
    };

    return (
      <WrappedComponent
        contentEditable={editing}
        suppressContentEditableWarning="true"
        onChange={handleChange}
        {...props}
      >
        {value}
      </WrappedComponent>
    );
  };
}
