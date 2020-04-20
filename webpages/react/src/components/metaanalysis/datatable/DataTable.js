import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';
import Head from './head/Head';
import Body from './body/Body';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

export default function DataTable(props) {
  const classes = useStyles();
  const { columns, papers } = props;
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} size="small" aria-label="Data Table">
        <Head columns={columns} />
        <Body papers={papers} />
      </Table>
    </TableContainer>
  );
}
