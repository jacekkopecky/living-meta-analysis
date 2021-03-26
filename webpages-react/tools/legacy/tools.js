(function (document, window) {
  'use strict';
  var lima = window.lima = window.lima || {};
  var _ = window.lima._ = {};  // underscore symbol is used for brevity, inspired by the underscore.js library

  /* dom functions
   *
   *
   *  #####   ####  #    #    ###### #    # #    #  ####  ##### #  ####  #    #  ####
   *  #    # #    # ##  ##    #      #    # ##   # #    #   #   # #    # ##   # #
   *  #    # #    # # ## #    #####  #    # # #  # #        #   # #    # # #  #  ####
   *  #    # #    # #    #    #      #    # #  # # #        #   # #    # #  # #      #
   *  #    # #    # #    #    #      #    # #   ## #    #   #   # #    # #   ## #    #
   *  #####   ####  #    #    #       ####  #    #  ####    #   #  ####  #    #  ####
   *
   *
   */

  /*
   * param root is optional
   */
  _.findEl = function findEl(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    if (!selector) return undefined;
    return root.querySelector(selector);
  };

  /*
   * param root is optional
   */
  _.findEls = function findEls(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    if (!selector) return [];
    return _.array(root.querySelectorAll(selector));
  };

  /*
   * finds the preceding sibling or ancestor that matches a selector, or returns null if not found
   */
  _.findPrecedingEl = function findPrecedingEl(el, selector) {
    while (el && !el.matches(selector)) el = el.previousElementSibling || el.parentElement;
    return el;
  };

  _.byId = function byId(id) {
    return document.getElementById(id);
  };

  // todo maybe if the template only has one child, return that instead of the DocumentFragment
  // this way we'd avoid all the _.cloneTemplate().children[0]
  _.cloneTemplate = function cloneTemplate(template) {
    if (!(template instanceof Node)) template = _.byId(template);
    if (!template) return void 0;

    if (template.content) {
      return template.content.cloneNode(true);
    } else {
      // this is not an HTML template (might be an SVG template, for example), so import its first child
      return document.importNode(template.children[0], true);
    }
  };

  _.array = function array(arr) {
    return [].slice.call(arr);
    // todo NodeList returned by document.querySelectorAll is soon getting .forEach so this function may soon no longer be needed
  };

  function valOrFun(val, param) {
    return (typeof val === 'function' && val.valOrFun !== 'val') ? val(param) : val;
  }

  _.f = function val(f) {
    if (typeof f === 'function') f.valOrFun = 'val';
    return f;
  };

  _.fillEls = function fillEls(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) {
      var newVal = valOrFun(value, el);
      if (el.textContent !== newVal) el.textContent = newVal == null ? '' : newVal;
    });
  };

  _.setProps = function setProps(root, selector, attr, value) {
    if (!(root instanceof Node)) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el[attr] = valOrFun(value, el); });
  };

  _.setAttrs = function setAttrs(root, selector, attr, value) {
    if (!(root instanceof Node)) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.setAttribute(attr, valOrFun(value, el)); });
  };

  _.setDataProps = function setDataProps(root, selector, name, value) {
    if (!(root instanceof Node)) {
      value = name;
      name = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.dataset[name] = valOrFun(value, el); });
  };

  _.addClass = function addClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.add(valOrFun(value, el));});
  };

  _.toggleClass = function toggleClass(root, selector, value, force) {
    if (!(root instanceof Node)) {
      force = value;
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.toggle(valOrFun(value, el), force);});
  };

  _.removeClass = function removeClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove(valOrFun(value, el));});
  };

  _.removeClasses = function removeClasses(root, selector, values) {
    if (!(root instanceof Node)) {
      values = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove.apply(el.classList, values);});
  };

  _.addEventListener = function addEventListener(root, selector, event, f) {
    if (!(root instanceof Node)) {
      f = event;
      event = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.addEventListener(event, f);});
  };

  _.fillTags = function fillTags(root, selector, tags, flashTag) {
    if (!(root instanceof Node)) {
      flashTag = tags;
      tags = selector;
      selector = root;
      root = document;
    }
    if (!tags) tags = [];

    var tagTemplate = _.byId('tag-template');
    var newTagTemplate = _.byId('new-tag-template');
    _.findEls(root, selector).forEach(function (el) {
      el.innerHTML = '';
      el.classList[tags.length ? 'remove' : 'add']('empty');
      tags.forEach(function (tag) {
        var tagEl = _.cloneTemplate(tagTemplate).children[0];
        _.fillEls(tagEl, '.tag', tag);
        if (flashTag === tag) {
          tagEl.classList.add('flash');
          setTimeout(function(){tagEl.classList.remove('flash');}, 50);
        }
        el.appendChild(tagEl);
      });
      if (newTagTemplate) el.appendChild(_.cloneTemplate(newTagTemplate));
    });
  };

  _.putCursorAtEnd = function putCursorAtEnd(el) {
    if (el && el.childNodes.length) {
      var selection = window.getSelection();
      var range = document.createRange();
      range.setStartAfter(el.childNodes[el.childNodes.length-1]);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // a workaround for strange chrome behaviour where it doesn't focus right:
  // e.g. clicking on the placeholder 'doi' of an empty editable doi value focuses the element but doesn't react to subsequent key strokes
  _.blurAndFocus = function(ev) {
    ev.target.blur();
    ev.target.focus();
  };

  // oneline input fields get blurred on enter (for Excel-like editing)
  _.blurOnEnter = function(ev) {
    if (ev.keyCode == 13 && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      ev.target.blur();
    }
  };


  _.linkEditTest = function(ev) {
    var btn = ev.target;
    if (!btn) return;

    var linkEl = null;
    var editEl = null;
    _.array(btn.parentElement.children).forEach(function (el) {
      if (el.classList.contains('value')) {
        if (el.nodeName === 'A') linkEl = el;
        else if (el.isContentEditable || el.contentEditable === 'true') editEl = el;
      }
    });

    if (!linkEl || !editEl) {
      console.error('linkEditTest cannot find linkEl or editEl');
      return;
    }

    var link = editEl.textContent;
    if (linkEl.dataset.base) link = linkEl.dataset.base + link;

    window.open(link, "linkedittest");
  };

  _.preventLinkEditBlur = function(ev) {
    var btn = ev.target;
    if (!btn) return;

    var editEl = null;
    _.array(btn.parentElement.children).forEach(function (el) {
      if (el.classList.contains('value') && (el.isContentEditable || el.contentEditable === 'true')) editEl = el;
    });

    if (!editEl) {
      console.error('preventLinkEditBlur cannot find editEl');
      return;
    }

    // clicking the 'test' button should not cause blur on the editing field
    if (document.activeElement === editEl) ev.preventDefault();
  };

  _.addOnInputUpdater = function addOnInputUpdater(root, selector, property, validatorSanitizer, target, targetProp, doBeforeChange, doAfterChange) {
    if (!(root instanceof Node)) {
      doAfterChange = doBeforeChange;
      doBeforeChange = targetProp;
      targetProp = target;
      target = validatorSanitizer;
      validatorSanitizer = property;
      property = selector;
      selector = root;
      root = document;
    }

    _.findEls(root, selector).forEach(function (el) {
      if (el.classList.contains('editing') || el.isContentEditable || el.contentEditable === 'true') {
        el.addEventListener('keydown', _.deferScheduledSave);
        el.oninput = function () {
          var value = el[property];
          if (typeof value === 'string' && value.trim() === '') value = '';
          try {
            if (validatorSanitizer) value = validatorSanitizer(value, el, property);
          } catch (err) {
            el.classList.add('validationerror');
            if (err) el.dataset.validationmessage = err.message || err;
            _.setValidationErrorClass();
            if (target) _.cancelScheduledSave(target);
            return;
          }
          el.classList.remove('validationerror');
          _.setValidationErrorClass();
          if (doBeforeChange) doBeforeChange(el);
          if (target) {
            _.assignDeepValue(target, targetProp, value);
            _.scheduleSave(target);
          }
          if (doAfterChange) doAfterChange(el);
        };
      } else {
        el.oninput = null;
      }
    });
  };

  _.assignDeepValue = function assignDeepValue(target, targetProp, value) {
    if (targetProp == null || Array.isArray(targetProp) && targetProp.length == 0) return undefined; // do nothing

    if (Array.isArray(targetProp) && targetProp.length > 0) {
      // flatten (and thus copy) targetProp so we can manipulate it
      targetProp = flattenNestedArray(targetProp);
      while (targetProp.length > 1) {
        var prop = targetProp.shift();
        if (prop == null) return undefined;
        if (!(prop in target) || target[prop] == null) {
          if (Number.isInteger(targetProp[0])) target[prop] = [];
          else target[prop] = {};
        }
        target = target[prop];
      }
      targetProp = targetProp[0];
    }

    target[targetProp] = value;
    return value;
  };

  _.getDeepValue = function getDeepValue(target, targetProp, addDefaultValue) {
    // flatten (and duplicate) the array so we don't affect the passed value
    targetProp = flattenNestedArray(targetProp);

    while (targetProp.length > 0) {
      var prop = targetProp.shift();
      if (prop == null) return undefined;
      if (!(prop in target) || target[prop] == null) {
        if (addDefaultValue != null) {
          if (targetProp.length == 0) target[prop] = addDefaultValue;
          else if (Number.isInteger(targetProp[0])) target[prop] = [];
          else target[prop] = {};
        } else {
          return undefined;
        }
      }
      target = target[prop];
    }

    return target;
  };

  function flattenNestedArray(arr) {
    if (!Array.isArray(arr)) return [arr];
    var retval = [];
    arr.forEach(function (x) {
      retval.push.apply(retval, flattenNestedArray(x));
    });
    return retval;
  }

  _.setValidationErrorClass = function setValidationErrorClass() {
    var el = _.findEl('.validationroot');
    if (el) el.classList.toggle('validationerror', !!(_.findEl('.validationroot .validationerror')));
  };

  _.setUnsavedClass = function setUnsavedClass() {
    var el = _.findEl('.validationroot');
    if (el) el.classList.toggle('unsaved', !!(_.findEl('.validationroot .unsaved')));
  };


  /* array manipulation
   *
   *
   *     ##   #####  #####    ##   #   #    #    #   ##   #    # # #####  #    # #        ##   ##### #  ####  #    #
   *    #  #  #    # #    #  #  #   # #     ##  ##  #  #  ##   # # #    # #    # #       #  #    #   # #    # ##   #
   *   #    # #    # #    # #    #   #      # ## # #    # # #  # # #    # #    # #      #    #   #   # #    # # #  #
   *   ###### #####  #####  ######   #      #    # ###### #  # # # #####  #    # #      ######   #   # #    # #  # #
   *   #    # #   #  #   #  #    #   #      #    # #    # #   ## # #      #    # #      #    #   #   # #    # #   ##
   *   #    # #    # #    # #    #   #      #    # #    # #    # # #       ####  ###### #    #   #   #  ####  #    #
   *
   *
   */

  _.moveArrayElement = function moveArrayElement(arr, oldIndex, newIndex) {
    if (oldIndex === newIndex || !Array.isArray(arr)) return arr;
    var content = arr[oldIndex];
    arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, content);
    return arr;
  };

  // remove an element from the array in-place, by value
  _.removeFromArray = function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  };

  // find out if a bigger array contains all the elements of a smaller array
  // we don't expect any duplicate entries here
  _.isSubset = function isSubset(superset, subset) {
    if (!subset || subset.length === 0) return true;
    if (!superset || superset.length === 0) return false;
    if (superset.length < subset.length) return false;

    for (var i = 0; i < subset.length; i++) {
      if (superset.indexOf(subset[i]) == -1) return false;
    }
    return true;
  };

  // turn an array of objects that may have IDs into a hash of objects keyed by ID values
  _.generateIDHash = function generateIDHash(objects) {
    var retval = {};
    objects.forEach(function (obj) {
      if (obj.id) retval[obj.id] = obj;
    });
    return retval;
  };

  // determine the biggest id in an array of objects with numeric IDs in string values, return that + 1
  _.getNextID = function getNextID(arr) {
    var max = 0; // we want to start at 1
    arr.forEach(function (obj) {
      if (obj.id && !isNaN(+obj.id) && max < +obj.id) max = +obj.id;
    });
    return '' + (max + 1);
  };


  /* bounds arrays
   *
   *
   *   #####   ####  #    # #    # #####   ####       ##   #####  #####    ##   #   #  ####
   *   #    # #    # #    # ##   # #    # #          #  #  #    # #    #  #  #   # #  #
   *   #####  #    # #    # # #  # #    #  ####     #    # #    # #    # #    #   #    ####
   *   #    # #    # #    # #  # # #    #      #    ###### #####  #####  ######   #        #
   *   #    # #    # #    # #   ## #    # #    #    #    # #   #  #   #  #    #   #   #    #
   *   #####   ####   ####  #    # #####   ####     #    # #    # #    # #    #   #    ####
   *
   *
   */

  _.Bounds = function() {
    if (this == null) return new _.Bounds();

    this.limits = [];
  };

  _.Bounds.prototype.add = function(min, max) {
    for (var i=0; i<this.limits.length; i+=1) {
      if (max < this.limits[i].min) {
        // this bound fits wholly before the next bound, insert it
        this.limits.splice(i, 0, { min: min, max: max});
        break;
      } else if (min <= this.limits[i].max) {
        // this bound overlaps the next one, merge them
        this.limits[i].min = Math.min(min, this.limits[i].min);
        this.limits[i].max = Math.max(max, this.limits[i].max);

        // merge subsequent bounds if they now overlap with the current one
        while (i<this.limits.length-1 && this.limits[i+1].min <= this.limits[i].max) {
          this.limits[i].max = Math.max(this.limits[i].max, this.limits[i+1].max);
          this.limits.splice(i+1, 1);
        }
        break;
      }
      // else this bound comes later, loop
    }
    // if we didn't break above, the current bound is the last one
    if (i == this.limits.length) this.limits.push({ min: min, max: max });
  };

  _.Bounds.prototype.isEmpty = function() {
    return !this.limits.length;
  };

  _.Bounds.prototype.getNearestOutsideValue = function(val) {
    // choose the value outside of the given bounds that's closest to the given val

    // find the first bounds that ends after val
    for (var i=0; i<this.limits.length; i+=1) {
      if (this.limits[i].max > val) break;
    }

    // no bounds end after val
    if (i == this.limits.length) {
      return val;
    }

    // the first bounds that ends after val also start after val
    if (this.limits[i].min >= val) {
      return val;
    }

    // the found bounds contains val, get the nearer edge
    var d1 = val - this.limits[i].min;
    var d2 = this.limits[i].max - val;

    if (d1 < d2) {
      return this.limits[i].min;
    } else {
      return this.limits[i].max;
    }
  };

  // find the index of the bounds that contains val, or -1 if no bounds contains val
  _.Bounds.prototype.indexOf = function(val) {
    // find the first bounds that ends after val
    for (var i=0; i<this.limits.length; i+=1) {
      if (this.limits[i].max >= val) break;
    }

    // no bounds end after val
    if (i == this.limits.length) {
      return -1;
    }

    // the first bounds that ends after val also start after val
    if (this.limits[i].min > val) {
      return -1;
    }

    return i;
  };

  /* input validation
   *
   *
   *   # #    # #####  #    # #####    #    #   ##   #      # #####    ##   ##### #  ####  #    #
   *   # ##   # #    # #    #   #      #    #  #  #  #      # #    #  #  #    #   # #    # ##   #
   *   # # #  # #    # #    #   #      #    # #    # #      # #    # #    #   #   # #    # # #  #
   *   # #  # # #####  #    #   #      #    # ###### #      # #    # ######   #   # #    # #  # #
   *   # #   ## #      #    #   #       #  #  #    # #      # #    # #    #   #   # #    # #   ##
   *   # #    # #       ####    #        ##   #    # ###### # #####  #    #   #   #  ####  #    #
   *
   *
   */

  _.strictToNumber = function strictToNumber(val) {
    if (typeof val == 'number') return val;
    if (typeof val == 'string') {
      if (val == '') return NaN;
      else return Number(val);
    }
    return NaN;
  };

  _.strictToNumberOrNull = function strictToNumberOrNull(val) {
    if (val == null) return val;
    if (typeof val == 'number') return val;
    if (typeof val == 'string') {
      if (val == '') return null;
      else return Number(val);
    }
    return NaN;
  };

  _.mod = function mod(x, n) {
    return ((x%n)+n)%n;
  };

  // regexp generated by http://unicode.org/cldr/utility/list-unicodeset.jsp?a=%5B%5Cp%7BN%7D%5Cp%7BL%7D%5D&abb=on&ucd=on&esc=on&g=&i=
  // excluding the high ranges from \U00010000 because somehow they break things
  _.lettersAndNumbersRE = /^[-.0-9A-Za-z\u00AA\u00B2\u00B3\u00B5\u00B9\u00BA\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u0660-\u0669\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u3192-\u3195\u31A0-\u31BA\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]+$/;


  /* error handling
   *
   *
   *    ###### #####  #####   ####  #####     #    #   ##   #    # #####  #      # #    #  ####
   *    #      #    # #    # #    # #    #    #    #  #  #  ##   # #    # #      # ##   # #    #
   *    #####  #    # #    # #    # #    #    ###### #    # # #  # #    # #      # # #  # #
   *    #      #####  #####  #    # #####     #    # ###### #  # # #    # #      # #  # # #  ###
   *    #      #   #  #   #  #    # #   #     #    # #    # #   ## #    # #      # #   ## #    #
   *    ###### #    # #    #  ####  #    #    #    # #    # #    # #####  ###### # #    #  ####
   *
   *
   */

  _.notFound = function notFound() {
    document.body.innerHTML = '';
    fetch('/404', { credentials: 'same-origin' })
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting 404');
      console.error(err);
      return '404 not found';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    });
  };

  _.apiFail = function apiFail() {
    document.body.innerHTML = '';
    console.error('apifail');
    fetch('/apifail', { credentials: 'same-origin' })
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting apifail page');
      console.error(err);
      return 'sorry, the server is temporarily unhappy (API failure)';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    });
  };

  /* testing
   *
   *
   *   ##### ######  ####  ##### # #    #  ####
   *     #   #      #        #   # ##   # #    #
   *     #   #####   ####    #   # # #  # #
   *     #   #           #   #   # #  # # #  ###
   *     #   #      #    #   #   # #   ## #    #
   *     #   ######  ####    #   # #    #  ####
   *
   *
   */

  // add an empty element to every page so that we can use it in UI tests
  function addTestingElement() {
    var el = document.createElement('div');
    el.id = 'testing-screenshot-element';
    document.body.insertBefore(el, document.body.children[0]);
  }
  if (window.localStorage.geminiTesting) addTestingElement();

  var tests = [];
  var globalErrors = [];

  // run the registered tests
  // log all output in window.testouput if we have that, otherwise in console log
  // quiet mode means test output always looks the same if all tests passed (no matter how many we ran)
  _.runTests = function runTests(quiet) {
    // as the last test, add reporting of global errors
    _.addTest(reportGlobalErrors);

    var successfulAssertions;
    var currentAssertion;
    var failedTests = 0;

    var AssertionError = function (message) {
      Error.call(this, message);
      this.name = 'AssertionError';
      this.message = message;
    };

    AssertionError.prototype = Object.create(Error.prototype);
    AssertionError.prototype.constructor = AssertionError;

    function assert(cond, msg) {
      currentAssertion += 1;
      if (!cond) throw new AssertionError(msg);
      successfulAssertions += 1;
    }

    var log = console.log;
    if (window.testoutput) {
      log = function() {
        console.log.apply(console, arguments);
        if (arguments[arguments.length - 1] instanceof AssertionError) {
          window.testoutput.textContent += arguments[0] + arguments[1].message + '\n';
        } else {
          window.testoutput.textContent += Array.prototype.join.call(arguments, ' ');
          if (arguments[arguments.length - 1].stack) window.testoutput.textContent += '\n  ' + arguments[arguments.length - 1].stack;
          window.testoutput.textContent += '\n';
        }
      };
    }

    if (quiet) {
      log('running tests');
    } else {
      log('running ' + tests.length + ' tests');
    }
    var testsCopy = tests.slice();
    var index = 0;

    // run tests asynchronously so browser updates view after every test
    setTimeout(function runNextTest() {
      if (testsCopy.length == 0) {
        if (quiet) {
          log('finished tests: ' + failedTests + ' failed');
        } else {
          log('finished ' + tests.length + ' tests: ' + (tests.length - failedTests) + ' passed, ' + failedTests + ' failed');
        }
        return;
      }

      var test = testsCopy.shift();
      successfulAssertions = 0;
      currentAssertion = -1;
      if (!quiet) log('running test ' + (test.name || index));
      try {
        test(assert);
      } catch (e) {
        log('  assertion #' + currentAssertion + ' error: ', e);
        failedTests += 1;
      }
      if (!quiet) log('   done test ' + (test.name || index) + ' (' + successfulAssertions + ' assertion(s) passed)');
      index += 1;

      setTimeout(runNextTest, 0);
    }, 0);
  };

  // call _.addTest(function) to add a test that will be run in tests/index.html
  // the function takes one parameter `assert` which is a function:
  // function assert(condition, errorMessage) - reports errorMessage if condition is falsy
  _.addTest = function addTest(f) { tests.push(f); };

  window.onerror = function globalError(msg, source) {
    globalErrors.push(source + ': ' + msg);
  };

  var GLOBAL_ERROR_SEP = "\n    ";

  function reportGlobalErrors(assert) {
    var message = globalErrors.length + ' global error(s):';
    for (var i=0; i<globalErrors.length; i+=1) {
      message += GLOBAL_ERROR_SEP + (i+1) + ': ' + globalErrors[i];
    }
    assert(globalErrors.length === 0, message);
  }


  /* formatting
   *
   *
   *   ######  ####  #####  #    #   ##   ##### ##### # #    #  ####
   *   #      #    # #    # ##  ##  #  #    #     #   # ##   # #    #
   *   #####  #    # #    # # ## # #    #   #     #   # # #  # #
   *   #      #    # #####  #    # ######   #     #   # #  # # #  ###
   *   #      #    # #   #  #    # #    #   #     #   # #   ## #    #
   *   #       ####  #    # #    # #    #   #     #   # #    #  ####
   *
   *
   */

  var months = ['Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec '];

  _.formatNiceDate = function formatNiceDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return months[d.getMonth()] + d.getDate() + ', ' + d.getFullYear();
  };

  _.formatDate = function formatDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return d.getFullYear() + "-" + twoDigits((d.getMonth()+1)) + "-" + twoDigits(d.getDate());
  };

  _.formatTime = function formatTime(d) {
    if (typeof d !== "object") d = new Date(+d);
    return twoDigits(d.getHours()) + ":" + twoDigits(d.getMinutes());
  };

  _.formatDateTime = function formatDateTime(d) {
    return _.formatDate(d) + " " + _.formatTime(d);
  };

  function twoDigits(x) {
    return x < 10 ? "0" + x : "" + x;
  }

  _.stripPrefix = function stripPrefix(prefix, string) {
    if (string.toLowerCase().startsWith(prefix)) {
      string = string.substring(prefix.length);
    }
    return string;
  };

  _.stripDOIPrefix = function (doi) { return _.stripPrefix('doi:', doi); };

  function formatNumber(x) {
    if (typeof x !== 'number') return x;
    var xabs = Math.abs(x);
    // if (xabs >= 1000) return x.toFixed(0); // this would drop the decimal point from large values (needs tweaks in padNumber below)
    if (xabs >= 100) return x.toFixed(1);
    if (xabs >= 10) return x.toFixed(2);
    // if (xabs >= 1) return x.toFixed(2);
    return x.toFixed(3);
  }

  // produce a presentable, not-too-high-precision string representation of a number
  _.fillPaddedValue = function fillPaddedValue(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }

    _.removeClasses(root, selector, ['pad1', 'pad2', 'pad3dot']);
    if (typeof value == 'number') {
      var padClass = null;
      var valabs = Math.abs(value);
      if (valabs >= 10) padClass = 'pad1';
      if (valabs >= 100) padClass = 'pad2';
      // if (valabs >= 1000) padClass = 'pad3dot'; // this would pad also for the decimal dot for large values that don't have it
      if (padClass) _.addClass(root, selector, padClass);

      value = formatNumber(value);
    }

    _.fillEls(root, selector, value);
  };


  /* youOrName
   *
   *
   *                        #######        #     #
   *    #   #  ####  #    # #     # #####  ##    #   ##   #    # ######
   *     # #  #    # #    # #     # #    # # #   #  #  #  ##  ## #
   *      #   #    # #    # #     # #    # #  #  # #    # # ## # #####
   *      #   #    # #    # #     # #####  #   # # ###### #    # #
   *      #   #    # #    # #     # #   #  #    ## #    # #    # #
   *      #    ####   ####  ####### #    # #     # #    # #    # ######
   *
   *
   * if the currently logged-in user matches the user the page is about,
   * use "your" and "you" in some places in the whole document,
   * otherwise use "Jo's" or "Jo" if the fname of the user the page is about is "Jo".
   *
   * The places to change are elements with the following classes (case is significant):
   * fnOrYour, fnOryou
   */
  _.setYouOrName = function setYouOrName() {
    lima.onSignInChange(setYouOrName);

    if (!lima.userPageIsAbout) {
      if (lima.whenUserPageIsAboutIsKnown) {
        lima.whenUserPageIsAboutIsKnown(setYouOrName);
        return;
      } else {
        console.error('setYouOrName can\'t be called on a page that\'s not about a user');
        return;
      }
    }

    var currentUser = lima.getAuthenticatedUserEmail();

    var y = (currentUser == lima.userPageIsAbout.email || lima.userLocalStorage);
    var n = !lima.userLocalStorage && lima.userPageIsAbout.name && lima.userPageIsAbout.name.givenName || 'User';

    lima.pageAboutYou = y;

    document.body.classList[y ? 'add' : 'remove']('page-about-you');

    _.fillEls('.fnOrYour', y ? 'Your' : n + "'s");
    _.fillEls('.fnOryou',  y ? 'you'  : n       );

    // Used on profile page, prefixes 'Your ' if you're signed in and the page
    // is about you. The space is needed for formatting.
    _.fillEls('.blankOrYour', y ? 'Your ' : '' );

    _.findEls('.needs-owner').forEach(function (el) {
      if (lima.userLocalStorage || el.dataset.owner === currentUser) {
        el.classList.add('yours');
      } else {
        el.classList.remove('yours');
      }
    });
  };


  /* fetch
   *
   *
   *    ###### ###### #####  ####  #    #
   *    #      #        #   #    # #    #
   *    #####  #####    #   #      ######
   *    #      #        #   #      #    #
   *    #      #        #   #    # #    #
   *    #      ######   #    ####  #    #
   *
   *
   * with fetch API, get the response JSON, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchJson = function fetchJson(response) {
    if (response.ok) return response.json();
    else return Promise.reject(response);
  };

  /*
   * with fetch API, get the response as text, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchText = function fetchText(response) {
    if (response.ok) return response.text();
    else return Promise.reject(response);
  };

  _.idTokenToFetchOptions = function idTokenToFetchOptions(idToken) {
    return idToken ? { headers: _.idTokenToFetchHeaders(idToken) } : void 0;
  };

  _.idTokenToFetchHeaders = function idTokenToFetchHeaders(idToken, extraHeaders) {
    var retval = {};
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(function (key) { retval[key] = extraHeaders[key]; });
    }
    if (idToken) retval.Authorization = "Bearer " + idToken;
    return retval;
  };

  // for testing purposes - simulating a delay before a promise is resolved
  _.delayPromise = function delayPromise(x) {
    return new Promise(function (resolve) {
      setTimeout(resolve, 1000, x);
    });
  };

  // adapted from underscore http://underscorejs.org/docs/underscore.html
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = Date.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = Date.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  /* save
   *
   *
   *     ####    ##   #    # ######
   *    #       #  #  #    # #
   *     ####  #    # #    # #####
   *         # ###### #    # #
   *    #    # #    #  #  #  #
   *     ####  #    #   ##   ######
   *
   *
   */


  /* the API to the generic saving functionality includes the following page-specific functions:
   *
   * checks that can prevent actually saving
   *   lima.checkToPreventSaving
   *   lima.checkToPreventForcedSaving
   *
   * events during saving
   *   lima.savePendingStarted
   *   lima.savePendingStopped
   *   lima.saveStarted
   *   lima.saveStopped
   *   lima.saveError
   */

  var pendingSaveTimeout = null;
  var pendingSaveFunctions = [];
  var currentSavingFunction = null;

  var SAVE_PENDING_TIMEOUT = 10000;

  _.scheduleSave = function scheduleSave(saveFunction) {
    if (typeof saveFunction !== 'function' && typeof saveFunction.save !== 'function') throw new Error('saveFunction not a function or an object with save()');

    if (lima.checkToPreventSaving && lima.checkToPreventSaving()) return;

    if (!pendingSaveTimeout && lima.savePendingStarted) lima.savePendingStarted();

    if (pendingSaveFunctions.indexOf(saveFunction) === -1) pendingSaveFunctions.push(saveFunction);

    _.deferScheduledSave();
    if (!pendingSaveTimeout) pendingSaveTimeout = setTimeout(doSaveIgnoreReject, SAVE_PENDING_TIMEOUT);
  };

  // setTimeout for save in 3s
  // if already set, cancel the old one and set a new one
  // but only replace the old one if the pending save started less than 10s ago
  _.deferScheduledSave = function deferScheduledSave() {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = setTimeout(doSaveIgnoreReject, SAVE_PENDING_TIMEOUT);
    }
  };

  _.cancelScheduledSave = function cancelScheduledSave(saveFunction) {
    var removeIndex = pendingSaveFunctions.indexOf(saveFunction);
    if (removeIndex !== -1) pendingSaveFunctions.splice(removeIndex, 1);

    if (pendingSaveFunctions.length !== 0) return;

    if (pendingSaveTimeout && lima.savePendingStopped) lima.savePendingStopped();

    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;
  };

  _.manualSave = doSave;

  _.isSaving = function isSaving(includePending) {
    if (includePending && pendingSaveFunctions.length !== 0) return true;
    return !!currentSavingFunction;
  };

  function doSaveIgnoreReject() {
    doSave().catch(function(){console.log('ignoring rejected save promise, failure assumed handled');});
  }

  function doSave() {
    if (currentSavingFunction) return Promise.resolve(currentSavingFunction);

    if (pendingSaveTimeout && lima.savePendingStopped) lima.savePendingStopped();

    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = null;

    if (lima.checkToPreventForcedSaving && lima.checkToPreventForcedSaving()) return Promise.reject();

    if (pendingSaveFunctions.length === 0) {
      if (lima.saveStopped) lima.saveStopped();
      return Promise.resolve();
    }

    // call the next saving function, on its success come to the rest
    // find saving function with minimum saveOrder so dependencies don't break
    var next = 0;
    for (var i=1; i<pendingSaveFunctions.length; i+=1) {
      if (pendingSaveFunctions[i].saveOrder < pendingSaveFunctions[next].saveOrder) next = i;
    }
    currentSavingFunction = pendingSaveFunctions[next];
    pendingSaveFunctions.splice(next, 1);

    if (lima.saveStarted) lima.saveStarted();

    var savePromise = null;
    // in case we get handed an object with save() instead of a save function
    if (typeof currentSavingFunction === 'function') {
      savePromise = currentSavingFunction();
    } else if (typeof currentSavingFunction.save === 'function') {
      savePromise = currentSavingFunction.save();
    } else {
      console.error('not a function or object with save()');
      console.error(currentSavingFunction);
    }

    return Promise.resolve(savePromise)
    .then(
      function success() {
        currentSavingFunction = null;
        return doSave();
      },
      function failure() {
        // put the failed save back in the queue
        if (pendingSaveFunctions.indexOf(currentSavingFunction) === -1) pendingSaveFunctions.unshift(currentSavingFunction);
        currentSavingFunction = null;

        if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
        pendingSaveTimeout = null;
        if (lima.saveError) lima.saveError();
        return Promise.reject();
      }
    );
  }

  var lastTime = 0;

  // unsaved new things (e.g. papers) have temporary IDs, this function generates them
  _.createId = function createId(type) {
    var currTime = Date.now();
    if (lastTime >= currTime) {
      currTime = lastTime + 1;
    }
    lastTime = currTime;
    return 'new_' + type + '_' + currTime;
  };

  /* navigation
   *
   *
   *   #    #   ##   #    # #  ####    ##   ##### #  ####  #    #
   *   ##   #  #  #  #    # # #    #  #  #    #   # #    # ##   #
   *   # #  # #    # #    # # #      #    #   #   # #    # # #  #
   *   #  # # ###### #    # # #  ### ######   #   # #    # #  # #
   *   #   ## #    #  #  #  # #    # #    #   #   # #    # #   ##
   *   #    # #    #   ##   #  ####  #    #   #   #  ####  #    #
   *
   *
   */

  /* the API to the generic page-leave-warning functionality includes the following page-specific functions:
   *
   * check to see if the page should warn about leaving
   *   lima.checkToPreventLeaving
   *
   * with thanks to stack overflow http://stackoverflow.com/a/7317311/6482703
   */

  window.addEventListener("beforeunload", function (e) {
    if (_.isSaving(true) || lima.checkToPreventLeaving && lima.checkToPreventLeaving()) {
      var confirmationMessage = 'The page contains unsaved changes. '
                              + 'If you leave before saving, your changes will be lost.';

      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    }
  });

  _.historyBackOrRedirect = function (url) {
    // go back in history, or if we can't, go to the provided url
    window.history.back();
    setTimeout(function(){
      window.location.href = url;
    }, 500);
  };

  /* tests
   *
   *
   *   ##### ######  ####  #####  ####
   *     #   #      #        #   #
   *     #   #####   ####    #    ####
   *     #   #           #   #        #
   *     #   #      #    #   #   #    #
   *     #   ######  ####    #    ####
   *
   *
   */

  _.addTest(function testBounds(assert) {
    var b = new _.Bounds();

    assert(b.limits);
    assert(b.isEmpty());

    assert(b.getNearestOutsideValue(0) == 0);
    assert(b.getNearestOutsideValue(.9) == .9);
    assert(b.getNearestOutsideValue(1) == 1);
    assert(b.getNearestOutsideValue(1.1) == 1.1);

    assert(b.indexOf(0) == -1);
    assert(b.indexOf(1) == -1);
    assert(b.indexOf(1.1) == -1);
    assert(b.indexOf(1.9) == -1);
    assert(b.indexOf(2) == -1);
    assert(b.indexOf(3.5) == -1);
    assert(b.indexOf(4.1) == -1);

    b.add(1,2);
    assert(!b.isEmpty());

    assert(b.getNearestOutsideValue(0) == 0);
    assert(b.getNearestOutsideValue(.9) == .9);
    assert(b.getNearestOutsideValue(1) == 1);
    assert(b.getNearestOutsideValue(1.1) == 1);

    assert(b.indexOf(0) == -1);
    assert(b.indexOf(1) == 0);
    assert(b.indexOf(1.1) == 0);
    assert(b.indexOf(1.9) == 0);
    assert(b.indexOf(2) == 0);
    assert(b.indexOf(3.5) == -1);
    assert(b.indexOf(4.1) == -1);

    b.add(3,4);
    assert(!b.isEmpty());

    assert(b.indexOf(0) == -1);
    assert(b.indexOf(1) == 0);
    assert(b.indexOf(1.1) == 0);
    assert(b.indexOf(1.9) == 0);
    assert(b.indexOf(2) == 0);
    assert(b.indexOf(3.5) == 1);
    assert(b.indexOf(4.1) == -1);

    assert(b.getNearestOutsideValue(0) == 0);
    assert(b.getNearestOutsideValue(.9) == .9);
    assert(b.getNearestOutsideValue(1) == 1);
    assert(b.getNearestOutsideValue(1.1) == 1);
    assert(b.getNearestOutsideValue(1.4) == 1);
    assert(b.getNearestOutsideValue(1.6) == 2);
    assert(b.getNearestOutsideValue(2) == 2);
    assert(b.getNearestOutsideValue(2.6) == 2.6);
    assert(b.getNearestOutsideValue(3.6) == 4);

    var old = JSON.stringify(b.limits);
    b.add(3,4);
    assert(JSON.stringify(b.limits) == old);

    b.add(3.2,4);
    assert(JSON.stringify(b.limits) == old);

    b.add(3.2,4.4);
    assert(JSON.stringify(b.limits) != old);

    assert(b.getNearestOutsideValue(0) == 0);
    assert(b.getNearestOutsideValue(3.6) == 3);
    assert(b.getNearestOutsideValue(3.8) == 4.4);

    assert(b.indexOf(0) == -1);
    assert(b.indexOf(1) == 0);
    assert(b.indexOf(1.1) == 0);
    assert(b.indexOf(1.9) == 0);
    assert(b.indexOf(2) == 0);
    assert(b.indexOf(3.5) == 1);
    assert(b.indexOf(4.1) == 1);

    b.add(-.3,.4);
    assert(b.getNearestOutsideValue(0) == -.3);
    assert(b.getNearestOutsideValue(.2) == .4);
    assert(b.getNearestOutsideValue(3.6) == 3);
    assert(b.getNearestOutsideValue(3.8) == 4.4);

    assert(b.limits.length == 3);

    b.add(2,2.5);

    assert(b.limits.length == 3);

    assert(b.indexOf(0) == 0);
    assert(b.indexOf(1) == 1);
    assert(b.indexOf(1.1) == 1);
    assert(b.indexOf(1.9) == 1);
    assert(b.indexOf(2) == 1);
    assert(b.indexOf(3.5) == 2);
    assert(b.indexOf(4.1) == 2);

  });

  _.addTest(function testFormatNumber(assert) {
    // use trimming so we can format the checks nicely
    function check(num,str) {
      assert(formatNumber(num) === str, 'error formatting ' + num + ', expecting ' + str + ' but got ' + formatNumber(num));
    }

    function check2(num,str) {
      check(-num, '-' + str);
    }


    check (     Infinity,  'Infinity' );
    check (     NaN     ,       'NaN' );
    check (     0       ,     '0.000' );
    check (    -0       ,     '0.000' );
    check (     0.004   ,     '0.004' );
    check (     0.0044  ,     '0.004' );
    check (     0.004501,     '0.005' );   // 0.004501 because 0.0045 is actually 0.00449999999999999966
    check (     0.0046  ,     '0.005' );
    check (     0.005   ,     '0.005' );
    check (     0.04    ,     '0.040' );
    check (     0.14    ,     '0.140' );
    check (     3.1     ,     '3.100' );
    check (     3.14    ,     '3.140' );
    check (    13.14    ,    '13.14'  );
    check (   113.14    ,   '113.1'   );
    check (  1113.14    ,  '1113.1'   );
    check ( 11113.14    , '11113.1'   );

    check2(     Infinity,  'Infinity' );
    check2(     0.004   ,     '0.004' );
    check2(     0.0044  ,     '0.004' );
    check2(     0.004501,     '0.005' );   // 0.004501 because 0.0045 is actually 0.00449999999999999966
    check2(     0.0046  ,     '0.005' );
    check2(     0.005   ,     '0.005' );
    check2(     0.04    ,     '0.040' );
    check2(     0.14    ,     '0.140' );
    check2(     3.1     ,     '3.100' );
    check2(     3.14    ,     '3.140' );
    check2(    13.14    ,    '13.14'  );
    check2(   113.14    ,   '113.1'   );
    check2(  1113.14    ,  '1113.1'   );
    check2( 11113.14    , '11113.1'   );

    check ('foo', 'foo');
    check ('3', '3');
    check (undefined, undefined);
    check (null, null);

    var a = {};
    check (a, a);
  });

  _.addTest(function testFlattenArray(assert) {
    function check(arr1,arr2) {
      assert(JSON.stringify(flattenNestedArray(arr1)) === JSON.stringify(arr2), 'expected array ' + JSON.stringify(arr1) + ' to equal ' + JSON.stringify(arr2) + ' but got ' + JSON.stringify(flattenNestedArray(arr1)));
    }

    check([],               []);
    check({},               [{}]);
    check({foo:'bar'},      [{foo:'bar'}]);
    check(1,                [1]);
    check(NaN,              [NaN]);
    check(undefined,        [undefined]);
    check([undefined],      [undefined]);
    check([1],              [1]);
    check([1,[]],           [1]);
    check([1,[],2],         [1,2]);
    check([[1]],            [1]);
    check([[1,2]],          [1,2]);
    check([[1,2],3],        [1,2,3]);
    check([[1,[2]],3],      [1,2,3]);
    check([[1,[[[2]]]],3],  [1,2,3]);
    check([[1,[[[]]]],3],   [1,3]);

    var a = [3,4,5];
    check([a,[1,a]],        [3,4,5,1,3,4,5]);
    a.push(6);
    check([a,[1,a]],        [3,4,5,6,1,3,4,5,6]);
  });

  _.addTest(function testDeepValueManipulators(assert) {
    var target;

    function checkGet(selector, value) {
      assert(JSON.stringify(_.getDeepValue(target, selector)) === JSON.stringify(value), 'expected ' + JSON.stringify(selector) + ' to get us ' + JSON.stringify(value) + ' but got ' + JSON.stringify(_.getDeepValue(target, selector)));
    }

    function checkGetWithDefault(selector, defaultValue, value) {
      assert(JSON.stringify(_.getDeepValue(target, selector, defaultValue)) === JSON.stringify(value), 'expected ' + JSON.stringify(selector) + ' to get us ' + JSON.stringify(value) + ' but got ' + JSON.stringify(_.getDeepValue(target, selector)));
    }

    function checkAssign(selector, value, expectedObject) {
      _.assignDeepValue(target, selector, value);
      assert(JSON.stringify(target) === JSON.stringify(expectedObject), 'expected ' + JSON.stringify(target) + ' to equal ' + JSON.stringify(expectedObject) + ' after setting ' + JSON.stringify(selector) + ' to ' + JSON.stringify(value));
    }

    target = {
      a: {
        'undefined': 4,
      },
    };

    checkGet( ['a'],               { 'undefined': 4});
    checkGet( ['a', undefined],    undefined);
    checkGet( ['a', 'undefined'],  4);

    target = {
      a: 3,
      b: {
        c: 4,
        d: [
          5,
          6,
          {
            e: 7,
          },
        ],
      },
    };

    checkGet( 'a',                      3);
    checkGet( 'b',                      { c: 4, d: [ 5, 6, { e: 7 } ] });
    checkGet( undefined,                undefined);
    checkGet( null,                     undefined);
    checkGet( '',                       undefined);
    checkGet( NaN,                      undefined);
    checkGet( ['b', 'c'],               4);
    checkGet( ['b', 'd'],               [ 5, 6, { e: 7 } ]);
    checkGet( ['b', 'd', 0],            5);
    checkGet( [['b', 'd'], 0],          5);
    checkGet( ['b', 'd', 1],            6);
    checkGet( ['b', 'd', 2],            { e: 7 });
    checkGet( ['b', 'd', 2, 'e'],       7);
    checkGet( ['b', 'd', 2, 'f'],       undefined);
    checkGet( ['b', 'd', 3],            undefined);
    checkGet( ['b', 'd', 3, 'e'],       undefined);
    checkGet( ['b', ['d', 3], 'e'],     undefined);
    checkGet( ['b', 'd', 'a'],          undefined);
    checkGet( ['', 'a'],                undefined);

    // the ordering of these tests is important
    checkGetWithDefault( 'a',                  42,            3);
    checkGetWithDefault( 'b',                  42,            { c: 4, d: [ 5, 6, { e: 7 } ] });
    checkGetWithDefault( ['b', 'c'],           42,            4);
    checkGetWithDefault( ['b', 'd'],           42,            [ 5, 6, { e: 7 } ]);
    checkGetWithDefault( ['b', 'd', 0],        42,            5);
    checkGetWithDefault( [['b', 'd'], 0],      42,            5);
    checkGetWithDefault( ['b', 'd', 1],        42,            6);
    checkGetWithDefault( ['b', 'd', 2],        42,            { e: 7 });
    checkGetWithDefault( ['b', 'd', 2, 'e'],   42,            7);

    checkGet           ( ['b', 'd', 2, 'f'],                  undefined);
    checkGetWithDefault( ['b', 'd', 2, 'f'],   42,            42);
    checkGet           ( ['b', 'd', 2, 'f'],                  42);

    checkGetWithDefault( ['b', 'd', 3],        42,            42);
    checkGet           ( ['b', 'd'],                          [ 5, 6, { e: 7, f: 42 }, 42 ]);

    checkGetWithDefault( ['b', 'd', 2, 'g'],   undefined,     undefined);
    checkGet           ( ['b', 'd'],                          [ 5, 6, { e: 7, f: 42 }, 42 ]);

    checkGetWithDefault( ['b', 'd', 4, 'e'],   42,            42);
    checkGet           ( ['b', 'd'],                          [ 5, 6, { e: 7, f: 42 }, 42, { e: 42 } ]);

    target = {};
    checkAssign( 'a',                      42,            {a:42});
    checkAssign( 'b',                       2,            {a:42, b:2});
    checkAssign( undefined,                12,            {a:42, b:2});

    var exception = null;
    try {
      checkAssign( ['b', 'c'],              3,            {a:42, b:2});
    } catch (e) { exception = e; }
    assert(exception != null, "assignDeepValue( ['b', 'c'], 3) should fail because b is 2 and we can't assing 'c' of that");

    checkAssign( '',                        4,            {a:42, b:2, '':4});
    checkAssign( ['c', 2, 'd'],             5,            {a:42, b:2, '':4, c:[undefined,undefined,{d:5}]});
    checkAssign( ['c', undefined, 'd'],     5,            {a:42, b:2, '':4, c:[undefined,undefined,{d:5}]});
    checkAssign( ['c', [2, 'e']],           6,            {a:42, b:2, '':4, c:[undefined,undefined,{d:5,e:6}]});
    checkAssign( [],                        7,            {a:42, b:2, '':4, c:[undefined,undefined,{d:5,e:6}]});
  });

})(document, window);
