/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import './Metaanalysis.css';

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Tags from './tags/Tags';
import Info from './info/Info';
import DataTable from './datatable/DataTable';
import Metadata from './metadata/Metadata';

// TabPanel is a container for the content of each tab
function TabPanel(props) {
  const {
    children, value, index, ...other
  } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

// returns the view with all the metaanalysis components
function Metaanalysis(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const { items } = props;
  // Tags
  const { tags } = items;
  // Info
  const { title, description, published } = items;
  // Table
  const { columns, papers } = items;
  // Metadata
  const { enteredByUsername, ctime, mtime } = items;
  return (
    <div className="metaanalysis">
      <div className="titlebar">
        <Typography className="title" variant="h4">
          {title}
        </Typography>
        <Tags tags={tags} />
      </div>
      <div className={classes.root}>
        <AppBar position="static">
          <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
            <Tab label="All" {...a11yProps(0)} />
            <Tab label="Info" {...a11yProps(1)} />
            <Tab label="Table" {...a11yProps(2)} />
            <Tab label="Charts" {...a11yProps(3)} />
            <Tab label="Plots" {...a11yProps(4)} />
            <Tab label="Aggregates" {...a11yProps(5)} />
          </Tabs>
        </AppBar>
        <TabPanel value={value} index={0}>
          <Info description={description} reference={published} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Info description={description} reference={published} />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <DataTable columns={columns} papers={papers} />
        </TabPanel>
        <TabPanel value={value} index={3}>
          Charts tab
        </TabPanel>
        <TabPanel value={value} index={4}>
          Plots tab
        </TabPanel>
        <TabPanel value={value} index={5}>
          Aggregates tab
        </TabPanel>
      </div>
      <Metadata username={enteredByUsername} ctime={ctime} mtime={mtime} />
    </div>
  );
}

export default Metaanalysis;
