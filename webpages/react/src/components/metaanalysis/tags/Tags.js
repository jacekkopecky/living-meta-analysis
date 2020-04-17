import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';


let tagCounter = 0;
function createNewTag(text) {
  tagCounter += 1;
  return {
    id: tagCounter,
    text,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: theme.spacing(0.5),
    margin: 0,
  },

  chip: {
    margin: theme.spacing(0.5),
  },
}));

export default function ChipsArray(props) {
  const { tags } = props;
  const classes = useStyles();
  const chipsArray = tags.map((data) => {
    const el = createNewTag(data);
    return el;
  });
  return (
    <ul className={classes.root}>
      {chipsArray.map((data) => {
        let icon;
        return (
          <li key={data.id}>
            <Chip
              icon={icon}
              label={data.text}
              className={classes.chip}
            />
          </li>
        );
      })}
    </ul>
  );
}

// https://codesandbox.io/s/93bfb?file=/demo.js
