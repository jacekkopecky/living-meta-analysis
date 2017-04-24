(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  var footer = _.findEl('body > footer');

  if (!footer) return;

  footer.innerHTML += '<p class="limaversion">version <span class="value">&hellip;</span> (<a href="/version/log">full changelog</a>)</p>';

  fetch('/version', { credentials: 'same-origin' })
  .then(_.fetchText)
  .then(function (text) { _.fillEls('.limaversion .value', text)})
  .catch(function (err) {
    console.error("problem getting version");
    console.error(err);
  });

})(window, document);
