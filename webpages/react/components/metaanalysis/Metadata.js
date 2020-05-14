import React from 'react';
import './Metadata.css';

function twoDigits(x) {
  return x < 10 ? `0${x}` : `${x}`;
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp);

  const date = `${d.getFullYear()}-${twoDigits((d.getMonth() + 1))}-${twoDigits(d.getDate())}`;
  const time = `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}`;
  const datetime = `${date} ${time}`;
  return datetime;
}


function Metadata({ metadata }) {
  const { enteredByUsername, ctime, mtime } = metadata;

  const path = `/${enteredByUsername}/`;
  return (
    <aside className="metadata">
      <p>
        Entered by
        {' '}
        <a href={path}>{enteredByUsername}</a>
        {' '}
        on
        {' '}
        {formatDateTime(ctime)}
      </p>
      <p>
        Last modified:
        {' '}
        {formatDateTime(mtime)}
      </p>
    </aside>
  );
}

export default Metadata;
