import{readFileSync as R,writeFileSync as W,mkdirSync}from'fs'
import{inflateRawSync as Z}from'zlib'
let{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env
let{instance:{exports:{m,r}}}=await WebAssembly.instantiate(Z(R(new URL('v',import.meta.url))))
let b=Buffer.from(m.buffer)
for(let j=0;j++<40;){
let s=(j<10?'/i00':'/i0')+j,d=o+s
let[p,t]=['/program','/input'].map(n=>R(i+s+n+'.bin'))
let e=r(
p.copy(b,4096),
t.copy(b,14e4,0,1e6))
mkdirSync(d,{recursive:true})
W(d+'/stdout.bin',b.slice(7e4,7e4+(e>>8)))
W(d+'/exit.txt',`${e&255}`)
}
