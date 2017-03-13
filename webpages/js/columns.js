(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  var columnsPromise;
  var columnsNextUpdate = 0;

  // predefined possible column types
  lima.columnTypes = ['characteristic', 'result'];

  lima.getColumns = function() {
    var curtime = Date.now();
    if (!columnsPromise || columnsNextUpdate < curtime) {
      columnsNextUpdate = curtime + 5 * 60 * 1000; // update paper titles no less than 5 minutes from now

      columnsPromise = lima.getGapiIDToken()
      .then(function (idToken) {
        return fetch('/api/columns', _.idTokenToFetchOptions(idToken));
      })
      .then(_.fetchJson)
      .then(storeColumns)
      .then(loadLocalColumnsIfLocalUser)
      .catch(function (err) {
        console.error("problem getting columns");
        console.error(err);
        throw _.apiFail();
      });
    }

    return columnsPromise;
  }

  lima.newColumn = function() {
    return storeColumn({id: _.createId('col'), type: lima.columnTypes[0], new: true});
  }

  function storeColumns(columns) {
    lima.columns = {};
    Object.keys(columns).forEach(function (id) {
      storeColumn(columns[id]);
    });
    return lima.columns;
  }

  function storeColumn(column) {
    if (!(column instanceof Column)) column = Object.assign(new Column(), column);
    lima.columns[column.id] = column;
    return column;
  }

  var localColumns = {};

  function loadLocalColumnsIfLocalUser() {
    if (!lima.userLocalStorage) return;

    if (!localStorage.columns) return;

    try {
      localColumns = JSON.parse(localStorage.columns);
    } catch (e) {
      var badColumns = localStorage.columns;
      localStorage.columns = '';
      // save the bad columns in case a user wants to recover the data
      localStorage.badColumns = badColumns;
      throw new Error("cannot parse localStorage.columns '" + badColumns + "'", e);
    }

    // similar to storeColumns in that it needs to call storeColumn
    // the locally-stored columns will replace any columns from the server,
    Object.keys(localColumns).forEach(function (id) {
      var serverColumn = lima.columns[id];
      var localColumn = storeColumn(localColumns[id]);

      // if the server's mtime is after the local copy's mtime (which must never get updated),
      // mark it as .outdated then later do something with that marker
      if (serverColumn.mtime > localColumn.mtime) {
        localColumn.outdated = serverColumn.mtime;
        console.info('column ' + id + ' outdated version in local storage');
      }

      // todo do something with the outdated columns, and storedLocally columns, e.g. allow reverting them
    });

  }

  function saveColumnLocally(col) {
    // wrapped in a promise to catch exceptions
    try {
      localColumns[col.id] = col;
      col.storedLocally = Date.now();
      localStorage.columns = JSON.stringify(localColumns);
    } catch (e) {
      return Promise.reject(new Error('failed to save column ' + col.id + ' locally', e));
    }
  }

  function Column() {}
  Column.prototype.saveOrder = 1; // this will be saved first
  Column.prototype.save = function saveColumn() {
    var col = this;
    var oldId = col.id;

    if (lima.userLocalStorage) return saveColumnLocally(col);

    return lima.getGapiIDToken()
      .then(function(idToken) {
        var toSend = JSON.stringify(col);
        if (col.new) {
          delete col.id;
          toSend = JSON.stringify(col);
          col.id = oldId;
        }
        return fetch('/api/columns', {
          method: 'POST',
          headers: _.idTokenToFetchHeaders(idToken, {'Content-type': 'application/json'}),
          body: toSend,
        });
      })
      .then(_.fetchJson)
      .then(function(json) {
        lima.columns[oldId] = storeColumn(json);
        col.id = json.id; // this allows us to get a new ID for a new column from the server
        if (lima.updateAfterColumnSave) lima.updateAfterColumnSave();
      })
      .catch(function(err) {
        console.error('error saving column');
        if (err instanceof Response) err.text().then(function (t) {console.error(t)});
        else console.error(err);
        throw err;
      })
  }

  // when a column is saved and its ID changes, this function helps
  // update to the new ID wherever columns are used
  lima.updateColumnListAfterColumnSave = function updateColumnListAfterColumnSave(list) {
    if (!Array.isArray(list)) return;

    list.forEach(function (key, index) {
      if (typeof key === 'string') {
        // data column
        var col = lima.columns[key];
        if (col && col.id !== key) {
          list[index] = col.id;
        }
      } else {
        // computed column
        updateColumnListAfterColumnSave(key.formulaParams);
        if (key.formula) {
          key.formula = lima.createFormulaString(key);
        }
      }
    });
  }

})(window, document);
