(function (document, window) {
  var _ = window._ = {};

  _.findEl = function findEl(root, selector) {
    return root.querySelector(selector);
  }

  /*
   * param root is optional
   */
  _.findEls = function findEls(root, selector) {
    if (selector == null) {
      selector = root;
      root = document;
    }
    return _.array(root.querySelectorAll(selector));
  }

  _.byId = function byId(id) {
    return document.getElementById(id);
  }

  _.array = function array(arr) {
      return [].slice.call(arr);
  }

  _.fillEls = function fillEls(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.textContent = value; });
  }

  _.addClass = function addClass(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.add(value);});
  }

  _.removeClass = function removeClass(root, selector, value) {
    if (value == null) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove(value);});
  }

})(document, window);
