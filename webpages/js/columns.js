(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  var columnsPromise;

  limeta.getColumns = function() {
    if (columnsPromise) return columnsPromise;

    columnsPromise = limeta.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(function (columns) {
      limeta.columns = columns;
      return columns;
    })
    .catch(function (err) {
      console.error("problem getting columns");
      console.error(err);
      limeta.apiFail();
    });

    return columnsPromise;
  }

})(window, document);
