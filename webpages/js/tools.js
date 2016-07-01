(function (document, window) {
  var _ = window._ = {};

  /*
   * param root is optional
   */
  _.findEl = function findEl(root, selector) {
    if (selector == null) {
      selector = root;
      root = document;
    }
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

  _.setProps = function setProps(root, selector, attr, value) {
    if (value == null) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el[attr] = value; });
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

  _.notFound = function notFound() {
    document.body.innerHTML = '';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/404');
    xhr.onload = function () {
      document.open();
      document.write(xhr.responseText);
      document.close();
    };
    xhr.send();
  }

  var months = ['Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec '];

  _.formatNiceDate = function formatNiceDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return months[d.getMonth()] + d.getDate() + ', ' + d.getFullYear();
  }

  _.formatDate = function formatDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return d.getFullYear() + "-" + twoDigits((d.getMonth()+1)) + "-" + twoDigits(d.getDate());
  }

  _.formatTime = function formatTime(d) {
    if (typeof d !== "object") d = new Date(+d);
    return twoDigits(d.getHours()) + ":" + twoDigits(d.getMinutes());
  }

  _.formatDateTime = function formatDateTime(d) {
    return _.formatDate(d) + " " + _.formatTime(d);
  }

  function twoDigits(x) {
    return x < 10 ? "0" + x : "" + x;
  }


})(document, window);
