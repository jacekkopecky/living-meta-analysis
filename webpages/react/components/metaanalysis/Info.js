import React, { useContext } from 'react';
import Editable from './Editable';
import EditContext from './EditContext';

import './Info.css';

function InfoText(props) {
  const {
    name, value, onSave,
  } = props;
  const edit = useContext(EditContext);
  return (
    <div className={name}>
      <p className="header">
        { name }
        :
        { ' ' }
      </p>
      <p className="text">
        <Editable edit={edit} onSave={onSave} type="textarea">{ value }</Editable>
      </p>
    </div>
  );
}

function Info(props) {
  const {
    published, setPublished, description, setDescription, edit,
  } = props;
  return (
    <section className="info">
      <InfoText name="published" onSave={setPublished} edit={edit} value={published} />
      <InfoText name="description" onSave={setDescription} edit={edit} value={description} />
    </section>
  );
}

export default Info;
