import React from 'react';
import Typography from '@material-ui/core/Typography';

export default function Description(props) {
  const { value } = props;
  return (
    <div className="description">
      <p className="descriptionHeader">Description : </p>
      <Typography variant="body1" className="referenceText">{value}</Typography>
    </div>
  );
}
