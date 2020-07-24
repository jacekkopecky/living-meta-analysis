import React from 'react';

const DEFAULT = {
  flag: false,
  toggle: () => {},
};

const editContext = React.createContext(DEFAULT);

export default editContext;
