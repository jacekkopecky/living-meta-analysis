import React from 'react';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';


function Head(props) {
  const { columns } = props;
  return (
    <TableHead>
      <TableRow>
        <TableCell>Paper</TableCell>
        <TableCell align="right">Study/Experiment</TableCell>
        {columns.map((col) => (
          <TableCell key={col.title} align="right">
            {col.title}
            {' '}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default Head;
