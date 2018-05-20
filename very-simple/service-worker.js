'use strict';


const cacheKey = `my-simple-cache-store`;


self.addEventListener('install', e => {
  console.log(`[install]`, e);


  e.waitUntil((async function() {
    // [START] below section you can disable
    await caches.open(cacheKey).then(function(cache) {
      console.log(`[Ready to add to cache]`);
      return cache.addAll(['index.html', '/']);
    });
    // [END]
  
    // go to next phase immediately, optional you also can disable this line.  
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  console.log(`[activate]`, e);

  // If you want make SW control the client now, you can invoke claim,
  // or default action it should be controlled after you reload page.
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  console.log(`[fetch]`, e);

  if(e.request.url.match(/test$/) !== null) {
    // Usage-0, Without caches.open so that it will look up all caches.
    return e.respondWith(caches.match(new Request(`index.html`)));

    // Usage-1, Without caches.open so that it will look up all caches.
    // return e.respondWith(caches.match(new Request(`index.html`)).then(resp => {
    //   console.log(`[fetch][debug][cache][matched]`, resp);
    //   return resp;
    // }));

    // Usage-2
    // return e.respondWith(caches.open(cacheKey).then(cache => {
    //   return cache.match(new Request(`index.html`));
    // }));
  }

  if(e.request.url.match(/nocache$/) !== null) {
    console.log(`[fetch][nocache]`);
    return e.respondWith(fetch('package.json'));
  }

  return e.respondWith(caches.match(e.request));
});
