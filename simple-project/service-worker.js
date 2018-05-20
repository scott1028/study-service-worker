'use strict';

console.log(navigator.onLine);

// In this file this === ServiceWorkerGlobalScope, instead of window in normal js script,
// so you can't access the global function defined in normal js script of others' file.
// 
// also here is no document variable.
if(this.window) {
  throw Error('Here should not have global variable named window!');
}
console.log(this);
console.log(`[found service worker script]!!`);

var cacheTarget = [
  'index.html',  // homepage
  'resource.gif',  // URI is ok
  'jquery-3.3.1.js',
];

// ======================= 底下只有再第一次註冊的時候跑一次 =======================
self.addEventListener('install', function(e) {
  console.log('=================== install event ===================')
  // ** 使用 waitUntil 保證再此 Phase 將執行完成內容的 Promise，即所有 waitUntil Promise 完成才會進入 activated Phase **

  var a, b;
  e.waitUntil((async function(){
    a = await new Promise(resolve => setTimeout(() => resolve('P1 done!'), 100));
    b = await new Promise(resolve => setTimeout(() => resolve('P1 done!'), 1500));
    console.log(a, b);
    return { a, b };
  })());
  console.log(`[waitUntil][feature]`, a, b);

  //
  // if client has already registered, this will not be executed again.
  //

  console.log('Cache event!')
  // 打開一個緩存空間，將相關需要緩存的資源添加到緩存裏面
  e.waitUntil(
    caches.open('my-first-cached').then(function(cache) {
      console.log('Adding to Cache');
      return cache.addAll(cacheTarget);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('=================== activate event ===================');
  console.log('Promise all', Promise, Promise.all);
  // make service worker controll all pages loading this js file.
  // Ref: https://developer.mozilla.org/zh-CN/docs/Web/API/ExtendableEvent/waitUntil

  // guarantee client ready phase after this promise has been done
  e.waitUntil((async function(){

    console.log('[delay activate start]', new Date().getTime());
    await new Promise(res => setTimeout(res, 4000));  // make this phase at least 3000 sec and then client get "controllerchange" event
    await self.clients.claim();  // make client service worker activated
    console.log('[delay activate end]', new Date().getTime());
    
    // This line will be execute after client service worker activated
    // Below need be after the client controllerchanged or SW is activated
    var promise = await self.clients.matchAll().then(function(clientList){
      console.log(`[found clientList]`, clientList);
      clientList.forEach(client => {
        client.postMessage(`Message from SW to Client`);
      });
    });
  })());  // this will cause ServiceWorker is ready event in client

  // e.waitUntil(self.clients.claim());
});


var customInterceptor = null;

// handle postMessage
self.addEventListener('message', function(e) {
  console.log(e);
  let test;
  try {
     test = eval(`(function (){ return ${e.data}; })()`);
  }
  catch(e) {
    test = {};
  }
  if(test.call !== undefined) {
    return customInterceptor = test;
  }
  console.log(`SW receive message from cleint`, e);
});

// override fetch handler, if no override there will be a default action such as original fetch
self.addEventListener('fetch', function(e) {
  console.log('=================== fetch event ===================');
  console.log(`[e.request.url]`, e.request.url);
  console.log(`[e]`, e);
  console.log(`[Network status is Online]`, navigator.onLine);

  if(customInterceptor) {
    console.log(`[is customInterceptor]`);
    customInterceptor(e);
    return;
  }
  // test if this request in caches
  // caches.open('my-first-cached').then(cache => {
  //   console.log(`[matched request in caches]`, cache.match(e.request).then(resp => console.log('[found cache-A]', resp)));
  //   cache.match(new Request('aabb.html')).then(resp => {
  //     if(!resp) {
  //       return console.error('no cache found!');
  //     }
  //     console.log(`[found cache-B]`, resp)
  //   });
  // });

  // hang phase before next event triggered, such as 'message' from client postMessage
  e.waitUntil((async function(){
    var log = await new Promise(res => setTimeout(() => res('fetch 5000 delay done!'), 5000));
    console.log(log);
  })());

  let isEmptyPath = /^http:\/\/(.*?)\/(.*?)$/g.exec(e.request.url)[2] === '';
  // if(caches.match(e.request)) {
  //   return e.respondWith(caches.match(e.request));
  // }
  if(isEmptyPath) {
    // return e.respondWith(fetch(new Request('index.html')));
    // return e.respondWith(caches.match(e.request));

    // simulate to cached content when it's offline.
    return e.respondWith(caches.open('my-first-cached').then(cache => {
      return cache.match(new Request('index.html'));  //.then(resp => resp);
    }));
  }

  // [ 首先判斷緩存當中是否已有相同資源 ]
  if(e.request.url.match(new RegExp(cacheTarget.join('|')))) {
    console.log('[matched]', e.request.url);
    return e.respondWith(caches.open('my-first-cached').then(cache => {
      return cache.match(e.request);  //.then(resp => resp);
    }));
  }

  // [ 順便更新 Cache 的寫法 ]
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

//
// This event need onLine so that it will be triggered.
//
self.addEventListener('sync', function(e) {
  console.log(`[sync] SW 後台 callback 已收到!!! If offLine=${navigator.onLine} this method will not be executed!!`, e);
});
