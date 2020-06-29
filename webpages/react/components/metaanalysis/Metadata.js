import React from 'react';
import { formatDateTime } from '../../tools/datatools';
import './Metadata.css';

function Metadata({ metadata }) {
  const { enteredByUsername, ctime, mtime } = metadata;

  const path = `/${enteredByUsername}/`;
  return (
    <aside className="metadata">
      <p>
        Entered by
        { ' ' }
        <a href={path}>{ enteredByUsername }</a>
        { ' ' }
        on
        { ' ' }
        { formatDateTime(ctime) }
      </p>
      <p>
        Last modified:
        { ' ' }
        { formatDateTime(mtime) }
      </p>
    </aside>
  );
}

export default Metadata;
