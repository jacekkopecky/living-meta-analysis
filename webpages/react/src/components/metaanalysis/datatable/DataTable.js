import React from 'react';
import './DataTable.css';

function fillTableData(data) {
  const lstId = [];
  const lstMap = [];
  const tab = [];
  Object.values(data.papers).forEach((paper) => {
    const { id } = paper;
    lstId.push(id);
  });
  data.columns.forEach((col) => {
    const { map } = col;
    if (map !== undefined) {
      lstMap.push(map);
    }
  });

  let row;
  lstId.forEach((id) => {
    row = [];
    lstMap.forEach((map) => {
      let found = false;
      Object.entries(map).forEach((m) => {
        if (id === m[0]) {
          row.push(m[1]);
          found = true;
        }
      });
      if (!found) row.push(undefined);
    });
    tab.push(row);
  });

  return (
    Object.entries(tab).map((row) => (
      <tr>
        <td>
          {data.papers[row[0]].title}
        </td>
        <td>
          {/* TODO : add study title and merge paper td accordingly */}
        </td>

        {row[1].map((cell) => {
          const paperData = data.papers[row[0]].experiments[0];
          return <td>{paperData.values[paperData.index.indexOf(cell)]}</td>;
        })}
      </tr>
    ))
  );
}

function DataTable(props) {
  const { columns, papers } = props;
  const data = {
    width: columns.length,
    height: papers.length,
    columns: columns.map((col) => ({
      id: col.id,
      title: col.title,
      map: col.sourceColumnMap,
    })),
    papers: papers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      experiments: paper.experiments.map((exp) => ({
        values: Object.values(exp.data).map((value) => value.value),
        index: Object.keys(exp.data).map((value) => value),
      })),
    })),
  };


  const header = columns.map((column) => (
    <th>
      {column.title}
    </th>
  ));

  return (
    <table className="datatable">
      <thead>
        <tr>
          <th>paper</th>
          <th>study/Experiment</th>
          {header}
        </tr>
      </thead>
      <tbody>
        {fillTableData(data)}
      </tbody>
    </table>
  );
}


export default DataTable;
