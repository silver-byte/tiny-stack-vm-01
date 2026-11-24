import * as fs from 'node:fs';
import {join} from 'node:path';

const input = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const {memory, run, n} = new WebAssembly.Instance(new WebAssembly.Module(
  fs.readFileSync(new URL('vm.wasm', import.meta.url))
)).exports as {memory: WebAssembly.Memory; run: (p: number, i: number) => number; n: WebAssembly.Global};

function runInstance(id: string) {
  const p = fs.readFileSync(join(input, id, 'program.bin'));
  const i = fs.readFileSync(join(input, id, 'input.bin'));
  const base = p.length + i.length;
  const pages = Math.ceil((base + 65536 + 2304 + 84 - memory.buffer.byteLength) / 65536);
  if (pages > 0) memory.grow(pages);
  const bytes = new Uint8Array(memory.buffer);
  bytes.set(p);
  bytes.set(i, p.length);
  const exit = run(p.length, i.length);
  const dir = join(output, id);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(join(dir, 'stdout.bin'), bytes.subarray(base, base + n.value));
  fs.writeFileSync(join(dir, 'exit.txt'), exit + '\n');
}

const ids = fs.readdirSync(input, {withFileTypes: true})
  .filter(d => d.isDirectory()).map(d => d.name).sort();
for (const id of ids) runInstance(id);
