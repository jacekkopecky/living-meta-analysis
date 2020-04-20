import React from 'react';
import TableBody from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';


function Body(props) {
  const { papers } = props;
  return (
    <TableBody>
      {papers.map((paper) => (
        <TableRow key={paper.title}>
          <TableCell component="th" scope="row">
            {paper.title}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

export default Body;
