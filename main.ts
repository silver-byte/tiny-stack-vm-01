import{inflateRawSync as I}from'node:zlib'
import{readFileSync as R,writeFileSync as W,mkdirSync as D,readdirSync as L}from'node:fs'
const{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env,{instance:{exports:{m,r}}}=await WebAssembly.instantiate(I(R(new URL('v',import.meta.url))))
for(const n of L(i)){let a=i+'/'+n,b=o+'/'+n,p=R(a+'/program.bin'),q=R(a+'/input.bin'),t=4096+p.length,u=t+q.length,g=Math.ceil(u/65536)+1-m.buffer.byteLength/65536
if(g>0)m.grow(g)
let s=new Uint8Array(m.buffer)
s.set(p,4096);s.set(q,t)
let x=r(p.length,q.length)
D(b,{recursive:true});W(b+'/stdout.bin',s.subarray(u,u+new Int32Array(s.buffer)[576]));W(b+'/exit.txt',x+'\n')}
