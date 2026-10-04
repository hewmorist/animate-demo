'use strict';
let calcShared=null,calcActive=null,calcSequence=0,calcQueue=[];
let calcPageGPU=null,calcUsePageGPU=false;
window.calcMetrics={completed:0,live:0,cache:0,last:null};
function completeCalc(data){
 const active=calcActive;calcActive=null;
 if(active&&!active.owner.stopped){
  if(data.error)active.owner.onerror?.(new Error(data.error));
  else{const p=data.p;calcMetrics.completed++;calcMetrics[active.priority===2?'cache':'live']++;
   calcMetrics.last={backend:p.backend,ms:p.renderMs,error:null};
   active.owner.onmessage?.({data});}
 }
 setTimeout(pumpCalc,active?.priority===2?16:0);
}
function calculateOnPage(workerReason){
 const active=calcActive;
 setTimeout(()=>{
  if(calcActive!==active)return;
  const p=active.p,start=performance.now();
  try{
   if(!calcPageGPU)calcPageGPU=createFractalGPU(true);
   calcUsePageGPU=true;
   const pixels=calcPageGPU(p);p.backend='GPU (page)';p.renderMs=performance.now()-start;
   completeCalc({id:active.id,p,pixels:pixels.buffer});
  }catch(e){completeCalc({id:active.id,error:workerReason+'; page GPU: '+e.message});}
 },0);
}
function pumpCalc(){
 if(calcActive||!calcQueue.length)return;
 calcQueue.sort((a,b)=>a.priority-b.priority||a.id-b.id);
 calcActive=calcQueue.shift();
 if(calcUsePageGPU||!calcShared)calculateOnPage('Worker GPU unavailable');
 else calcShared.postMessage({id:calcActive.id,p:calcActive.p});
}
class CalcWorker {
 constructor(priority){
  this.priority=priority;this.onmessage=null;this.onerror=null;this.stopped=false;
  if(!calcShared&&!calcUsePageGPU){
   try{calcShared=new Worker('calc-worker.js?v=fj-release-1');}
   catch(e){calcUsePageGPU=true;return;}
   calcShared.onmessage=e=>{
    if(!calcActive||e.data.id!==calcActive.id)return;
    if(e.data.error&&/OffscreenCanvas|WebGL2 unavailable/.test(e.data.error))calculateOnPage(e.data.error);
    else completeCalc(e.data);
   };
   calcShared.onerror=e=>{
    const owners=new Set(calcQueue.map(j=>j.owner));if(calcActive)owners.add(calcActive.owner);
    calcQueue=[];calcActive=null;calcShared.terminate();calcShared=null;
    for(const owner of owners)owner.onerror?.(e);
   };
  }
 }
 postMessage(p){if(this.stopped)return;calcQueue.push({id:++calcSequence,p:{...p,calc:'gpu'},priority:this.priority,owner:this});pumpCalc();}
 terminate(){this.stopped=true;calcQueue=calcQueue.filter(j=>j.owner!==this);}
}
