import React from 'react';
import Typography from '@material-ui/core/Typography';

export default function Reference(props) {
  const { value } = props;
  return (
    <div className="reference">
      <p className="referenceHeader">Reference : </p>
      <Typography variant="body1" className="referenceText">{value}</Typography>
    </div>
  );
}
