import React from 'react';
import Editable from './Editable';

import './Info.css';

function InfoText(props) {
  const {
    name, value, onSave,
  } = props;
  return (
    <div className={name}>
      <p className="header">
        { name }
        :
        { ' ' }
      </p>
      <p className="text">
        <Editable onSave={onSave} type="textarea">{ value }</Editable>
      </p>
    </div>
  );
}

function Info(props) {
  const {
    published, setPublished, description, setDescription,
  } = props;
  return (
    <section className="info">
      <InfoText name="published" onSave={setPublished} value={published} />
      <InfoText name="description" onSave={setDescription} value={description} />
    </section>
  );
}

export default Info;
