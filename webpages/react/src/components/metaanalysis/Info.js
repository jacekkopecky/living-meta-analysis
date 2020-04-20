import React from 'react';
import './Info.css';

function Reference(props) {
  const { value } = props;
  return (
    <div className="reference">
      <p className="referenceHeader">Reference : </p>
      <p className="referenceText">{value}</p>
    </div>
  );
}

function Description(props) {
  const { value } = props;
  return (
    <div className="description">
      <p className="descriptionHeader">Description : </p>
      <p className="descriptionText">{value}</p>
    </div>
  );
}

// TODO: refactor into 1 function

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
