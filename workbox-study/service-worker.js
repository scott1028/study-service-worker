importScripts('workbox-sw.js');

// 
// [Note!!] Why after self.clients.claim(), there is a null in navigator.serviceWorker.controller of client page.
// 
// serviceWorker 的開發測試建議用 incognito mode 並且使用重新開啟瀏覽器方式保證避免於 claim() 後 navigator.serviceWorker.controller = null 的問題！
// 
// [Resolution] It's a bug of chrome, sometime you need to close chrome application and then re-open a new application of chrome.
// 
// Ref: https://stackoverflow.com/questions/38168276/navigator-serviceworker-controller-is-null-until-page-refresh

if(workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

// For Development, below section are optional
workbox.setConfig({ debug: true });
workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);


// TestCase-1
// {
//   self.addEventListener('install', e => {
//     e.waitUntil(
//       caches.open(workbox.core.cacheNames.runtime)
//       // caches.open('my-cache-v1')
//       .then((cache) => {
//         return cache.put(
//           new Request('/demo/workbox-strategies/cache-only-populated-cache'),
//           new Response('Hello from the populated cache.')
//         );
//       })
//     );
//   });

//   self.addEventListener("activate", async e => {
//     console.log(`[event][activate]`);
//     e.waitUntil(
//       (async function(){
//         console.log(`[event][before claim]`);
//         await self.clients.claim();
//         console.log(`[event][after claim]`);
//         await self.clients.matchAll().then(clientList => {
//           console.log(clientList);
//         });
//       })()
//     );
//   });

//   self.addEventListener('install', function(event) {
//       event.waitUntil(self.skipWaiting()); // Activate worker immediately
//   });

//   self.addEventListener('activate', function(event) {
//       event.waitUntil(self.clients.claim()); // Become available to all pages
//   });

//   self.addEventListener('fetch', e => {
//     console.log(`[event][fetch]`, e);
//     const networkFirst = new workbox.strategies.NetworkFirst();
//     e.respondWith(networkFirst.handle({ event: e }));
//   });
// }

// Ref: https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox#.clientsClaim
// You need this or you need to reload the page so that service work will be activated.
// Claim any currently available clients once the service worker becomes active. This is normally used in conjunction with skipWaiting().
// 
// Why you need reload that cacheStorage of serviceWorker will be avaliable,
// because first loading page, the service worker might not be activated, it will go through from install -> installed -> activated, etc
// and after all are done, you only can control the page
// setTimeout(() => {
//   workbox.clientsClaim();  // equal: clientsClaim(){self.addEventListener("activate",()=>self.clients.claim())}
// }, 3000);
// console.log(workbox);


// TestCase-3
// {
//   // make prefetch
//   var cacheList = [
//     'jquery-3.3.1.js',
//     'resource.gif',
//     { url: '/index.html', revision: '383676' },
//   ];

//   // 可以考慮關閉 precache 只讓 workbox 針對 request 過的 route 進行 cache!!
//   workbox.precaching.precacheAndRoute(cacheList);

//   // 至少要 precache 這個離線 render 才能用
//   // or disable this line and then you must do a fetch('index.html') in your javascript of index.html later.
//   // workbox.precaching.precacheAndRoute(['index.html']);
// }

// TestCase-2
{
  workbox.skipWaiting();
  workbox.clientsClaim();  // after this SW should control the client page, or you need to reload the page so that SW could control the client page!!

  // setup cache strategy
  workbox.routing.registerRoute(
    /.*\.js/,
    workbox.strategies.networkFirst()
    // workbox.strategies.cacheFirst()
  );

  workbox.routing.registerRoute(
    /.*\.gif/,
    workbox.strategies.networkFirst()
    // workbox.strategies.cacheFirst()
  );

  workbox.routing.registerRoute(
    /.*\.png/,
    workbox.strategies.networkFirst()
    // workbox.strategies.cacheFirst()
  );

  workbox.routing.registerRoute(
    /.*\.html/,
    workbox.strategies.networkFirst()
    // workbox.strategies.cacheFirst()
  );

  // This for cache http://127.0.0.1:8080/
  // or
  // other API call such as /api/login/
  workbox.routing.registerRoute(
    /\/$/,
    workbox.strategies.networkFirst()
  );

  // workbox.routing.setDefaultHandler(({url, event, params}) => {
  //   console.log(url, event, params);
  // });
}
