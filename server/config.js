module.exports = {
  // shared constants
  EMAIL_ADDRESS_RE: '[a-zA-Z0-9.+-]+@[a-zA-Z0-9.+-]+',
  NEW_PAPER_TITLE: 'new-paper',
  NEW_META_TITLE: 'new-metaanalysis',
  TITLE_RE: '[a-zA-Z0-9.-]+',

  // this is a delay for demonstration purposes so the server seems slow
  demoApiDelay: 0,

  // google-specific settings
  gcloudProject: {
    projectId: 'jacek-soc-port-ac-uk',
    keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
  },
  gcloudDatastoreNamespace: 'living-meta-analysis-v2',
};
