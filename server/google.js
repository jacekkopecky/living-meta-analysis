module.exports = {
  project: function gcloudProject() {
    gcloud = require('google-cloud')({
      projectId: 'jacek-soc-port-ac-uk',
      keyFilename: 'jacek-soc-port-ac-uk-google-key.json',
    });
    return gcloud;
  },
  datastore: function gcloudDatastore(gcloud, pNamespace){
    // to use local datastore, add apiEndpoint: 'http://localhost:<port>'
    datastore = gcloud.datastore({ namespace: pNamespace });
    return datastore;
  }
};
