import React from 'react';
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
      <p>
        Entered by
        {' '}
        <a href={path}>{username}</a>
        {' '}
        on
        {' '}
        {handleTime(ctime)}
      </p>
      <p>
        Last modified :
        {' '}
        {handleTime(mtime)}
      </p>
    </div>
  );
}

export default Metadata;
