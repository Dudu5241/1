/* Service worker: aplikacja działa offline. Nowa wersja pobiera się sama, gdy jest internet. */
var CACHE='drzewo-cache-v1';
var CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(CORE.map(function(u){
        return c.add(new Request(u,{cache:'reload'})).catch(function(){});
      }));
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

async function handle(r){
  var cache=await caches.open(CACHE);
  var net=fetch(r,{cache:'no-store'}).then(function(res){
    if(res.ok&&res.status===200&&res.type==='basic'){cache.put(r,res.clone()).catch(function(){})}
    return res;
  });
  net.catch(function(){});
  try{
    return await Promise.race([net,new Promise(function(_,rej){setTimeout(rej,4000)})]);
  }catch(err){
    var hit=await cache.match(r);
    if(!hit&&r.mode==='navigate')hit=await cache.match('index.html');
    if(hit)return hit;
    try{return await net}catch(e2){return Response.error()}
  }
}

self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
  e.respondWith(handle(r));
});
