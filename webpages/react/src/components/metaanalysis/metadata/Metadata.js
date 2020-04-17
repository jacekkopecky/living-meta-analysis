import React from 'react';
import Typography from '@material-ui/core/Typography';
import './Metadata.css';

function twoDigits(x) {
  return x < 10 ? `0${x}` : `${x}`;
}

function handleTime(timestamp) {
  const d = new Date(timestamp);

  const date = `${d.getFullYear()}-${twoDigits((d.getMonth() + 1))}-${twoDigits(d.getDate())}`;
  const time = `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}`;
  const datetime = `${date} ${time}`;
  return datetime;
}


function Metadata(props) {
  const {
    username, ctime, mtime,
  } = props;
  const path = `/${username}/`;
  return (
    <div className="metadata">
      <Typography variant="body2">
        Entered by
        {' '}
        <a href={path}>{username}</a>
        {' '}
        on
        {' '}
        {handleTime(ctime)}
      </Typography>
      <Typography variant="body2">
        Last modified :
        {' '}
        {handleTime(mtime)}
      </Typography>
    </div>
  );
}

export default Metadata;
