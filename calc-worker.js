'use strict';
importScripts('gpu.js?v=fj-release-1');
let gpu=null;
self.onmessage=({data:{p,id}})=>{
 const start=performance.now();
 try{if(!gpu)gpu=createFractalGPU();const pixels=gpu(p);p.renderMs=performance.now()-start;self.postMessage({id,p,pixels:pixels.buffer},[pixels.buffer]);}
 catch(error){self.postMessage({id,error:String(error)});}
};
