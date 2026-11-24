import{readFileSync as R,writeFileSync as W,mkdirSync}from'node:fs'
import{inflateRawSync as Z}from'node:zlib'
let{MAKEFUN_INPUT_DIR:i='/input',MAKEFUN_OUTPUT_DIR:o='/output'}=process.env
let{instance:{exports:{m,r}}}=await WebAssembly.instantiate(Z(R(new URL('v',import.meta.url))))
let b=Buffer.from(m.buffer)
for(let j=0;j++<40;){
let s=(j<10?'/i00':'/i0')+j,d=o+s
let e=r(
R(i+s+'/program.bin').copy(b,4096),
R(i+s+'/input.bin').copy(b,14e4,0,1e6))
mkdirSync(d,{recursive:true})
W(d+'/stdout.bin',b.subarray(7e4,7e4+(e>>8)))
W(d+'/exit.txt',`${e&255}`)
}
