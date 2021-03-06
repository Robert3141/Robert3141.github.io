'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "9b23901c8399fd924bc12fa4a1738f33",
"assets/assets/fonts/AstroSpace.ttf": "5892adccd6c4b8c9e80f005e7eef06f2",
"assets/assets/images/1.png": "0ef91f29ca581be21b1238d0acc62545",
"assets/assets/images/2.png": "f6488ff297999e741547d2081e243915",
"assets/assets/images/3.png": "a7fed042a993721f8f017c17ee9a8698",
"assets/assets/images/4.png": "2a0cde87dacaae77c837a6ce11269da9",
"assets/assets/images/5.png": "6cf5a880a3726fd80a1eaf23456c35a4",
"assets/assets/images/6.png": "167c31a71654c5c3c3bcbbdb707f9426",
"assets/assets/images/background.jpg": "29256e49f615523f92cbec82ba3cc412",
"assets/assets/images/desert.png": "bd76924e91a2f0470456fcf6bab0bc1d",
"assets/assets/images/help.jpg": "2eac84f2885fae95e0449a316fc86257",
"assets/assets/images/hills.png": "fbd9b4307ba5809b67f901677550eeae",
"assets/assets/images/left.png": "6295ff53bb78d131a06dfa45099e75ef",
"assets/assets/images/moon.png": "bc2bfc91fa2160257a0139a939df7431",
"assets/assets/images/player.png": "eb1f3e6b5ac9fd053db4c1962336c9b3",
"assets/assets/music/1.ogg": "a2e8baf63c7d1a85fb1310328f7bb9df",
"assets/assets/music/2.ogg": "e4e4bb25f78269f07738bd1fec83471d",
"assets/assets/music/3.ogg": "dbf5305c9d32da0f3ba743bebe126b29",
"assets/assets/music/4.ogg": "a37b7e65fe7e783aad926b9760d6b9c5",
"assets/assets/music/5.ogg": "88f01d70c453a1c1ccff16c9a40d2575",
"assets/assets/music/6.ogg": "3d518b2e027877c67d5472e80277a796",
"assets/assets/music/LICENSE.txt": "b912078b7e19d6318e9840ecb234c839",
"assets/FontManifest.json": "ac669f33d94496b85e3203eb46758554",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "c6a1ffd60885ec35fcc285287e942cb6",
"favicon.png": "86a70a609ed7233caf4fb51aa3c26b66",
"fonts/AstroSpace.ttf": "5892adccd6c4b8c9e80f005e7eef06f2",
"icons/Icon-192.png": "f6185b2289c76ee9c9e661471db2702e",
"index.html": "684f135f369b7bf8a0a9a42b9ac6764b",
"/": "684f135f369b7bf8a0a9a42b9ac6764b",
"main.dart.js": "c9b9966d28874aea918dec13dd5766f8",
"manifest.json": "c61983cfd07d283cd547ffd092f6ad3f",
"style.css": "d92f7af692863290a67a9f4fcc3b1f38",
"version.json": "233eccbad0dcaead09ad6367e79e694c"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
