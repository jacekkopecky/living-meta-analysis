import React from 'react';
import Typography from '@material-ui/core/Typography';
import './Info.css';

function Description(props) {
  const { value } = props;
  return (
    <div className="description">
      <p className="descriptionHeader">Description : </p>
      <Typography variant="body1" className="referenceText">{value}</Typography>
    </div>
  );
}
function Reference(props) {
  const { value } = props;
  return (
    <div className="reference">
      <p className="referenceHeader">Reference : </p>
      <Typography variant="body1" className="referenceText">{value}</Typography>
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
