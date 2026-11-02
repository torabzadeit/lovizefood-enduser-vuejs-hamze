// Browser shim for the static preview: answers the app's API calls from the
// bundled sample data (no server needed). Generated into the page head.
(function () {
  var ORIGIN = '__ORIGIN__';
  var mock = createMock(__SAMPLE__);
  var P = XMLHttpRequest.prototype, realOpen = P.open, realSend = P.send;

  P.open = function (method, url) {
    var u = String(url);
    this.__mock = u.indexOf(ORIGIN) === 0 ? { m: String(method).toUpperCase(), p: new URL(u).pathname } : null;
    return realOpen.apply(this, arguments);
  };
  P.send = function (body) {
    var mk = this.__mock;
    if (!mk) return realSend.apply(this, arguments);
    var self = this, parsed = {};
    try { parsed = body ? JSON.parse(body) : {}; } catch (e) {}
    var out = mock.handle(mk.m, mk.p, parsed) || { status: 404, body: { statusCode: 404, message: 'mock: not implemented' } };
    var text = JSON.stringify(out.body);
    setTimeout(function () {
      function def(k, v) { Object.defineProperty(self, k, { value: v, configurable: true }); }
      def('readyState', 4); def('status', out.status); def('statusText', '');
      def('responseText', text); def('response', text); def('responseURL', ORIGIN + mk.p);
      self.getAllResponseHeaders = function () { return 'content-type: application/json\r\n'; };
      self.getResponseHeader = function (h) { return /content-type/i.test(h) ? 'application/json' : null; };
      ['readystatechange', 'load', 'loadend'].forEach(function (ev) { self.dispatchEvent(new Event(ev)); });
    }, 120);
  };

  // Product photos: swap the API image URLs for the generated placeholders.
  function fix(img) {
    var s = img.getAttribute && img.getAttribute('src');
    if (!s || s.indexOf(ORIGIN + '/public/food/') !== 0) return;
    var svg = mock.image(s.slice(ORIGIN.length));
    if (svg) img.setAttribute('src', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  new MutationObserver(function (list) {
    list.forEach(function (r) {
      if (r.type === 'attributes') fix(r.target);
      r.addedNodes && r.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') fix(n);
        else if (n.querySelectorAll) n.querySelectorAll('img').forEach(fix);
      });
    });
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
})();
