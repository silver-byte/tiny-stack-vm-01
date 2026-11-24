import{inflateRawSync as I}from'node:zlib';
import{readFileSync as R,writeFileSync as W,mkdirSync as D,readdirSync as L}from'node:fs';
const{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env
const{instance:{exports:{m,r}}}=await WebAssembly.instantiate(I(R(new URL('v',import.meta.url))))
const ids=L(i).sort()
for(const n of ids){
  const a=i+'/'+n,b=o+'/'+n
  const p=R(a+'/program.bin'),q=R(a+'/input.bin')
  const t=4096+p.length,u=t+q.length
  const bytes=u+65536
  if(bytes>m.buffer.byteLength)m.grow(Math.ceil((bytes-m.buffer.byteLength)/65536))
  const s=Buffer.from(m.buffer)
  s.set(p,4096)
  s.set(q,t)
  const x=r(p.length,q.length)
  D(b,{recursive:true})
  W(b+'/stdout.bin',s.subarray(u,u+s.readUInt32LE(2304)))
  W(b+'/exit.txt',x+'\n')
}
