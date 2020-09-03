import React, { useContext } from 'react';
import { formatDateTime } from '../../tools/datatools';
import EditContext from './EditContext';
import './Metadata.css';

function Metadata({ metadata }) {
  const { enteredByUsername, ctime, mtime } = metadata;
  const edit = useContext(EditContext);

  const path = `/${enteredByUsername}/`;
  return (
    <aside className={edit.flag ? 'metadata editMode secondary' : 'metadata'}>
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
