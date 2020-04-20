import React from 'react';
import Description from './description/Description';
import Reference from './reference/Reference';
import './Info.css';

function Info(props) {
  const { reference, description } = props;
  return (
    <div className="info">
      <Reference value={reference} />
      <Description value={description} />
    </div>
  );
}

export default Info;
