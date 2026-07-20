/* オフライン用。データを変えたら CACHE を上げる。 */
var CACHE = "team-v3";
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=3",
  "./app.js?v=2",
  "./team.json?v=1",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* ネット優先、落ちたらキャッシュ。更新が確実に届く。 */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
  );
});
