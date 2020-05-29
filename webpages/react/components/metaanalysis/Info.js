import React from 'react';
import HookEditable from './HookEditable';
import './Info.css';


function InfoText(props) {
  const { name, value } = props;
  const EditableP = HookEditable('p');
  return (
    <div className={name}>
      <p className="header">
        {name}
        :
        {' '}
      </p>
      <EditableP className="text" value={value} />
    </div>
  );
}

function Info(props) {
  const { reference, description } = props;
  return (
    <section className="info">
      <InfoText name="reference" value={reference} />
      <InfoText name="description" value={description} />
    </section>
  );
}

export default Info;
