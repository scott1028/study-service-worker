'use strict';


self.addEventListener('install', function(e) {
  console.log('Cache event!')
  // 打開一個緩存空間，將相關需要緩存的資源添加到緩存裏面
  e.waitUntil(
    caches.open('my-first-cached').then(function(cache) {
      console.log('Adding to Cache');
      return cache.addAll([
      	'index.html',  // homepage
      	'resource.gif'  // URI is ok
      ]);
    })
  )
});

self.addEventListener('activate', function(e) {
  console.log('Activate event');
  console.log('Promise all', Promise, Promise.all);
  // make service worker controll all pages loading this js file.
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log(e);
  // e.respondWith( // 首先判斷緩存當中是否已有相同資源
  //   caches.match(e.request).then(function(response) {
  //     if (response != null) { // 如果緩存中已有資源則直接使用
  //       // 否則使用fetch API請求新的資源
  //       console.log('Using cache for:', e.request.url)
  //       return response
  //     }
  //     console.log('Fallback to fetch:', e.request.url)
  //     return fetch(e.request.url);
  //   })
  // )

  // you also can intercept all request then fake them!!!
  // this need fetch promise and first chain need to return
  // a response a object.
	// e.respondWith(fetch('service-worker.js'));
	e.respondWith(
		new Response(
			`{ "hello": "world" }`,
			{
				status: 202,
				headers: { 'Content-type': 'application/json' }
			}));
});