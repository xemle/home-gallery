j = ((document) => {
  function J(selector) {
    if (!selector) {
      this.nodes = [];
    } else if (typeof selector === 'string') {
      this.nodes = [...document.querySelectorAll(selector)];
    } else if (Array.isArray(selector)) {
      this.nodes = selector;
    } else if (typeof selector === 'function') {
      this.nodes = [];
      if (document.readyState !== 'loading') {
        selector();
      } else {
        document.addEventListener('DOMContentLoaded', selector);
      }
    } else {
      this.nodes = [selector];
    }
  }

  J.prototype = {
    get: function(index) {
      return this.nodes[index];
    },
    each: function(fn) {
      this.nodes.forEach((node, i) => fn.call(this, node, i));
      return this;
    },
    on: function(eventName, fn) {
      this.each(node => node.addEventListener(eventName, fn));
      return this;
    },
    click: function(fn) {
      this.on('click', fn);
      return this;
    },
    attr: function(attr) {
      return this.get(0).getAttribute(attr);
    },
    data: function(data) {
      return this.attr(`data-${data}`);
    },
    find: function(selector) {
      let nodes = [];
      this.each(node => {
        nodes = nodes.concat([...node.querySelectorAll(selector)]);
      })
      return new J(nodes);
    },
    addClass: function(className) {
      this.each(node => node.classList.add(className));
      return this;
    },
    removeClass: function(className) {
      this.each(node => node.classList.remove(className));
      return this;
    }
  }

  const initializer = (selector) => new J(selector);

  initializer.fn = J.prototype;

  return initializer;
})(document);
