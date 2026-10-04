 'use strict';
function createFractalGPU(onPage=false){
 const canvas=onPage?document.createElement('canvas'):new OffscreenCanvas(1,1);
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL2 unavailable in '+(onPage?'page':'worker')+'');
 gl.disable(gl.DITHER);
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();
 gl.attachShader(program,compile(gl.VERTEX_SHADER,'#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;
precision highp int;
uniform vec2 centerHi,centerLo,pixelUnit,paramHi,paramLo;
uniform float size,phase,vibrance;
uniform int maxIter;
uniform vec3 palette[4];
out vec4 color;
vec2 add(vec2 a,vec2 b){float s=a.x+b.x;float v=s-a.x;float e=(a.x-(s-v))+(b.x-v)+a.y+b.y;return vec2(s+e,e-((s+e)-s));}
vec2 neg(vec2 a){return -a;}
vec2 mul(vec2 a,vec2 b){
 float p=a.x*b.x;
 // Bit splitting cannot collapse through arithmetic reassociation.
 float ah=uintBitsToFloat(floatBitsToUint(a.x)&0xfffff000u),al=a.x-ah;
 float bh=uintBitsToFloat(floatBitsToUint(b.x)&0xfffff000u),bl=b.x-bh;
 float e=((ah*bh-p)+ah*bl+al*bh)+al*bl+a.x*b.y+a.y*b.x;
 return vec2(p+e,e-((p+e)-p));
}

void main(){
 vec2 zr=add(vec2(centerHi.x,centerLo.x),mul(vec2(gl_FragCoord.x-size*.5,0.),pixelUnit));
 vec2 zi=add(vec2(centerHi.y,centerLo.y),mul(vec2(size*.5-gl_FragCoord.y,0.),pixelUnit));
 vec2 cr=vec2(paramHi.x,paramLo.x),ci=vec2(paramHi.y,paramLo.y);
 float mag=0.;int n=maxIter;
 for(int k=0;k<5000;k++){
  if(k>=maxIter)break;
  float r=zr.x+zr.y,j=zi.x+zi.y;mag=r*r+j*j;
  if(mag>256.){n=k;break;}
  vec2 rr=mul(zr,zr),jj=mul(zi,zi),rj=mul(zr,zi);
  zi=add(add(rj,rj),ci);zr=add(add(rr,neg(jj)),cr);
 }
 if(n==maxIter){color=vec4(vec3(5.,7.,17.)/255.,1.);return;}
 float smoothN=float(n)+1.-log2(max(1.,log2(sqrt(mag))));
 float v=smoothN*.042+phase,b=floor(v),f=fract(v);f=f*f*(3.-2.*f);
 int i=int(mod(b,4.));vec3 rgb=mix(palette[i],palette[(i+1)%4],f);
 float mid=(max(rgb.r,max(rgb.g,rgb.b))+min(rgb.r,min(rgb.g,rgb.b)))*.5-18.*vibrance;
 rgb=clamp(vec3(mid)+(rgb-vec3(mid))*(1.+1.8*vibrance),0.,255.);
 rgb*=.66+.34*min(1.,float(n)/30.);
 color=vec4(rgb/255.,1.);
}
`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const u={};for(const n of ['centerHi','centerLo','pixelUnit','paramHi','paramLo','size','phase','vibrance','maxIter','palette[0]'])u[n]=gl.getUniformLocation(program,n);
 return p=>{
  if(gl.isContextLost())throw Error('GPU context lost');
  if(p.kind!=='julia')throw Error('This GPU branch supports Julia fractals');
  if(canvas.width!==p.width){canvas.width=p.width;canvas.height=p.width;}
  gl.viewport(0,0,p.width,p.width);gl.useProgram(program);
  function split(hi,lo,v){const h=v.map(Math.fround);gl.uniform2fv(u[hi],h);gl.uniform2fv(u[lo],v.map((x,i)=>x-h[i]));}
  split('centerHi','centerLo',[p.cx,p.cy]);split('paramHi','paramLo',p.parameter);
  const unit=p.span/p.width,h=Math.fround(unit);gl.uniform2f(u.pixelUnit,h,unit-h);
  gl.uniform1f(u.size,p.width);gl.uniform1f(u.phase,(p.seed%997)*.001);gl.uniform1f(u.vibrance,p.vibrance||0);gl.uniform1i(u.maxIter,p.iterations);
  gl.uniform3fv(u['palette[0]'],p.palette.flat());gl.drawArrays(gl.TRIANGLES,0,6);
  const pixels=new Uint8ClampedArray(p.width*p.width*4);gl.readPixels(0,0,p.width,p.width,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('GPU error '+error);
  p.backend='GPU';return pixels;
 };
}
