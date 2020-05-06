import React from 'react';
import './Info.css';


function InfoText(props) {
  const { name, value } = props;
  return (
    <div className={name}>
      <p className="header">
        {name}
        {' '}
        :
        {' '}
      </p>
      <p className="text">{value}</p>
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
