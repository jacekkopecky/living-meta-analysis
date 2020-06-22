/* global QUnit */
'use strict';

let tools;

QUnit.module('General Tools', {
  beforeEach: (assert) => {
    tools = require('../../../server/lib/tools');
    assert.notEqual(tools, null, 'Tools should be defined');
  },
});

QUnit.test('tools.number', (assert) => {
  assert.equal(tools.number(3), 3, 'tools.number(3) should return 3');
  assert.equal(tools.number('3'), 3, "tools.number('3') should return 3");
  assert.equal(tools.number('3.14'), 3.14, "tools.number('3.14') should return 3.14");

  // Special Values
  assert.equal(tools.number(null), null, 'tools.number(null) should return null');
  assert.equal(tools.number(undefined), undefined, 'tools.number(undefined) should return undefined');

  // Undefined on non-numbers
  // NOTE: Expect errors to be logged into the console. This will not prevent the test from passing
  assert.equal(tools.number(NaN), undefined, 'tools.number(NaN) should return undefined');
  assert.equal(tools.number({}), undefined, 'tools.number({}) should return undefined');
  assert.equal(tools.number([]), undefined, 'tools.number([]) should return undefined');
  assert.equal(tools.number(() => { }), undefined, 'tools.number(() => {}) should return undefined');

  assert.equal(tools.number('i'), undefined, "tools.number('i') should return undefined");
  assert.equal(tools.number('3i'), undefined, "tools.number('3i') should return undefined");
  assert.equal(tools.number(''), undefined, "tools.number('') should return undefined");
});
