import React, { useContext, useState } from 'react';
import GrabIcon from 'url:../../../images/grab-icon.png';
import Cell from './Cell';
import { formatDateTimeSplit } from '../../../tools/datatools';
import EditContext from '../EditContext';
import RearrangeRow from '../TableRearranger';

const paperDetails = (paper) => {
  const {
    title, enteredBy, ctime, reference, description, link, doi, mtime,
  } = paper;
  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>
              Paper:
              { ' ' }
            </td>
            <td>
              { title }
            </td>
          </tr>
          <tr>
            <td>
              Reference:
              { ' ' }
            </td>
            <td>
              { reference || 'no reference available' }
            </td>
          </tr>
          <tr>
            <td>
              Description:
              { ' ' }
            </td>
            <td>
              { description || 'No description available' }
            </td>
          </tr>
          <tr>
            <td>
              Link:
              { ' ' }
            </td>
            <td>
              { link || 'No link available' }
            </td>
          </tr>
          <tr>
            <td>
              DOI:
              { ' ' }
            </td>
            <td>
              { doi || 'No digital object identifier available' }
            </td>
          </tr>
          <tr>
            <td>
              Entered by:
              { ' ' }
            </td>
            <td>
              { enteredBy }
              { ' ' }
              at
              { ' ' }
              { formatDateTimeSplit(ctime).time }
              { ' ' }
              on
              { ' ' }
              { formatDateTimeSplit(ctime).date }
            </td>
          </tr>
          <tr>
            <td>
              Last modified:
              { ' ' }
            </td>
            <td>
              { formatDateTimeSplit(mtime).time }
              { ' ' }
              on
              { ' ' }
              { formatDateTimeSplit(mtime).date }
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const expDetails = (exp) => {
  const { paper, title, description } = exp;
  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>
              Study or Experiment:
              { ' ' }
            </td>
            <td>
              { title }
            </td>
          </tr>
          <tr>
            <td>
              Paper:
              { ' ' }
            </td>
            <td>
              { paper.title }
            </td>
          </tr>
          <tr>
            <td>
              Description:
              { ' ' }
            </td>
            <td>
              { description || 'No description available' }
            </td>
          </tr>
          <tr>
            <td>
              Entered by:
              { ' ' }
            </td>
            <td>
              { paper.enteredBy }
              { ' ' }
              at
              { ' ' }
              { formatDateTimeSplit(paper.ctime).time }
              { ' ' }
              on
              { ' ' }
              { formatDateTimeSplit(paper.ctime).date }
            </td>
          </tr>
          <tr>
            <td>
              Last modified:
              { ' ' }
            </td>
            <td>
              { formatDateTimeSplit(paper.mtime).time }
              { ' ' }
              on
              { ' ' }
              { formatDateTimeSplit(paper.mtime).date }
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

function Paper(props) {
  const {
    paper, columns, makeClickable, editCell, parentOfRows, papers, paperOrderValue,
  } = props;
  const { title } = paper;

  const edit = useContext(EditContext);
  const [rowEvent, setRowEvent] = useState({ rows: [], topRowIndex: null });

  const nExp = Object.keys(paper.experiments).length;

  return (
    paper.experiments.map((exp, key) => {
      let newPaper;
      let firstTr;
      if (key === 0) {
        newPaper = (
          <td key={title} {...makeClickable(title, paperDetails(paper), 'paper')} rowSpan={nExp}>
            { edit.flag
              ? (
                <button
                  type="submit"
                  className="grabberButton"
                  onDragStart={
                    (e) => RearrangeRow(
                      rowEvent, setRowEvent, parentOfRows, e, papers, paperOrderValue,
                    )
                  }
                  onDragEnd={
                    (e) => RearrangeRow(
                      rowEvent, setRowEvent, parentOfRows, e, papers, paperOrderValue,
                    )
                  }
                >
                  <img src={GrabIcon} alt="Grabber" className="grabberIcon" />
                </button>
              )
              : '' }
            { title }
          </td>
        );
        firstTr = 'paperstart';
      }
      return (
        <tr
          key={exp.ctime + paper.id}
          className={firstTr}
        >
          { newPaper }
          <td {...makeClickable(exp.ctime + paper.id, expDetails(exp))} key={exp.title}>
            { exp.title }
          </td>

          { columns.map((col) => (
            <Cell
              cellId={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              key={`${exp.ctime + paper.id}+${col.formula || col.id}`}
              col={col}
              exp={exp}
              makeClickable={makeClickable}
              editCell={editCell}
            />
          )) }

        </tr>
      );
    })
  );
}

export default Paper;
