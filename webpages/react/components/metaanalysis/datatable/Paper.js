/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import Cell from './Cell';
import { formatDateTime } from '../../../tools/datatools';

const paperDetails = (paper) => {
  const {
    title, enteredBy, ctime, reference, description, link, doi, mtime,
  } = paper;
  return (
    <>
      <p>Paper: {title}</p>
      <p>Entered by {enteredBy} on {formatDateTime(ctime)}</p>
      <p>Reference: {reference}</p>
      <p>Description: {description}</p>
      <p>Link: {link}</p>
      <p>DOI: {doi}</p>
      <p>Last Modified: {formatDateTime(mtime)}</p>
    </>
  );
};

const expDetails = (exp) => {
  const { paper, title, description } = exp;
  return (
    <>
      <p>{paper.title}</p>
      <p>{title}</p>
      <p>{description || 'no detailed description'}</p>
    </>
  );
};

function Paper(props) {
  const {
    paper, columns, makeClickable, edit,
  } = props;
  const { title } = paper;

  const nExp = Object.keys(paper.experiments).length;

  return (
    paper.experiments.map((exp, key) => {
      let newPaper;
      let firstTr;
      if (key === 0) {
        newPaper = (
          <td key={title} {...makeClickable(title, paperDetails(paper))} rowSpan={nExp}>
            {title}
          </td>
        );
        firstTr = 'paperstart';
      }
      return (
        <tr
          key={exp.ctime + paper.id}
          className={firstTr}
        >
          {newPaper}
          <td {...makeClickable(exp.ctime + paper.id, expDetails(exp))} key={exp.title}>
            {exp.title}
          </td>

          {columns.map((col) => (
            <Cell
              cellId={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              key={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              col={col}
              exp={exp}
              makeClickable={makeClickable}
              edit={edit}
            />
          ))}

        </tr>
      );
    })
  );
}

export default Paper;
