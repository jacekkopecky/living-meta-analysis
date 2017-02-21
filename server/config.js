module.exports = {
  // shared constants
  EMAIL_ADDRESS_RE: '[a-zA-Z0-9.+-]+@[a-zA-Z0-9.+-]+',
  NEW_PAPER_TITLE: 'new-paper',
  NEW_META_TITLE: 'new-metaanalysis',
  TITLE_RE: '[a-zA-Z0-9.-]+',

  // where to store Web access logs; relative to project root
  logDirectory: './log',
  // morgan format for access log lines, default is 'combined'
  logFormat: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time[0] ms',   // eslint-disable-line

  // this is a delay for demonstration purposes so the server seems slow
  demoApiDelay: 0,

  // google-specific settings
  gcloudProject: {
    projectId: 'jacek-soc-port-ac-uk',
    keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
  },
  gcloudDatastoreNamespace: 'living-meta-analysis-v2',
  port: 8080,
  // comment out, or delete, the following lines, to have LiMA running on HTTP only
  httpsPort: 8443,
  httpsCert: '/etc/letsencrypt/live/lima.soc.port.ac.uk/fullchain.pem',
  httpsKey: '/etc/letsencrypt/live/lima.soc.port.ac.uk/privkey.pem',
};
