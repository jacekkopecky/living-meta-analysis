(async function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  const lima = window.lima;
  const _ = lima._;  // underscore symbol is used for brevity, defined in tools.js

  const footer = _.findEl('body > footer');

  if (!footer) return;

  footer.innerHTML += '<p class="limaversion">version <a class="value">&hellip;</a> (<a href="/version/log">full changelog</a>)</p>';

  try {
    const response = await fetch('/version', { credentials: 'same-origin' });
    const text = await _.fetchText(response);
    _.fillEls('.limaversion .value', text.substring(0, 8));
    const url = `https://github.com/jacekkopecky/living-meta-analysis/commit/${text}`;
    _.setProps('.limaversion .value', 'href', url);
  } catch (err) {
    console.error("problem getting version");
    console.error(err);
  }
})(window, document);
