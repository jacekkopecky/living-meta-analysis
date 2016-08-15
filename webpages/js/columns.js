(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  var columnsPromise;

  function Columns() {}
  Columns.prototype.scheduleSave = function() { console.info('scheduling save of columns'); };

  lima.getColumns = function() {
    if (columnsPromise) return columnsPromise;

    columnsPromise = lima.getGapiIDToken()
    .then(function (idToken) {
      return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
    })
    .then(_.fetchJson)
    .then(function (columns) {
      if (!(columns instanceof Columns)) columns = Object.assign(new Columns(), columns);
      lima.columns = columns;
      lima.columnTypes = [];
      Object.keys(columns).forEach(function (colId) {
        if (lima.columnTypes.indexOf(columns[colId].type) === -1) {
          lima.columnTypes.push(columns[colId].type);
        }
      })
      return columns;
    })
    .catch(function (err) {
      console.error("problem getting columns");
      console.error(err);
      _.apiFail();
    });

    return columnsPromise;
  }

})(window, document);
