(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  lima.apiFail = lima.apiFail || function(){};

  var columnsPromise;

  lima.getColumns = function() {
    if (columnsPromise) return columnsPromise;

    columnsPromise = lima.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(function (columns) {
      lima.columns = columns;
      return columns;
    })
    .catch(function (err) {
      console.error("problem getting columns");
      console.error(err);
      lima.apiFail();
    });

    return columnsPromise;
  }

})(window, document);
