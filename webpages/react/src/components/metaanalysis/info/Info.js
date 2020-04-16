import React from 'react';
import './Info.css';

function Description(props) {
  const { value } = props;
  return (
    <div className="description">
      <p className="descriptionHeader">Description : </p>
      <div className="descriptionText">{value}</div>
    </div>
  );
}
function Reference(props) {
  const { value } = props;
  return (
    <div className="reference">
      <p className="referenceHeader">Reference : </p>
      <div className="referenceText">{value}</div>
    </div>
  );
}

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
