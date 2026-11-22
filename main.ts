import * as fs from "node:fs";
import * as path from "node:path";

const inDir = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const IMM = new Map<number, number>([[0x01, 1], [0x02, 4], [0x30, 2], [0x31, 2], [0x32, 2], [0x33, 2]]);

const OPS = new Set<number>([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B,
  0x1C, 0x1D, 0x1E, 0x20, 0x21, 0x22, 0x30, 0x31, 0x32, 0x33, 0x34, 0x40,
  0x41, 0x50, 0x51, 0x52, 0x53]);

const STEPS_LIMIT = 1000000;
const OUT_LIMIT = 65536;
const M32 = 4294967296;

function toInt(u: number): number {
  return u >= 0x80000000 ? u - M32 : u;
}

function run(prog: Uint8Array, input: Uint8Array): { out: number[]; exit: number } {
  const stack: number[] = [];
  const calls: number[] = [];
  const mem = new Int32Array(256);
  const out: number[] = [];
  let pc = 0;
  let ip = 0;
  let steps = 0;
  const plen = prog.length;

  while (true) {
    if (steps >= STEPS_LIMIT) return { out, exit: 10 };
    if (pc < 0 || pc >= plen) return { out, exit: 9 };
    const op = prog[pc];
    if (!OPS.has(op)) return { out, exit: 5 };
    const immLen = IMM.get(op) ?? 0;
    if (pc + immLen >= plen) return { out, exit: 9 };
    steps++;

    let sp = stack.length;
    let jumped = false;

    switch (op) {
      case 0x00: return { out, exit: 0 };
      case 0x01: {
        if (sp + 1 > 256) return { out, exit: 3 };
        const pb = prog[pc + 1]; stack.push(pb >= 0x80 ? pb - 256 : pb);
        break;
      }
      case 0x02: {
        if (sp + 1 > 256) return { out, exit: 3 };
        const v = prog[pc + 1] | (prog[pc + 2] << 8) | (prog[pc + 3] << 16) | (prog[pc + 4] << 24);
        stack.push(v | 0);
        break;
      }
      case 0x03: if (sp < 1) return { out, exit: 2 }; stack.pop(); break;
      case 0x04: if (sp < 1) return { out, exit: 2 }; if (sp + 1 > 256) return { out, exit: 3 }; stack.push(stack[sp - 1]); break;
      case 0x05: if (sp < 2) return { out, exit: 2 }; { const a = stack[sp - 1]; stack[sp - 1] = stack[sp - 2]; stack[sp - 2] = a; } break;
      case 0x06: if (sp < 2) return { out, exit: 2 }; if (sp + 1 > 256) return { out, exit: 3 }; stack.push(stack[sp - 2]); break;
      case 0x07: {
        if (sp < 3) return { out, exit: 2 };
        const a = stack[sp - 3]; const b = stack[sp - 2]; const c = stack[sp - 1];
        stack.length -= 3;
        stack.push(b, c, a);
        break;
      }
      case 0x17: if (sp < 1) return { out, exit: 2 }; stack.push((-stack.pop()!) | 0); break;
      case 0x1B: if (sp < 1) return { out, exit: 2 }; stack.push(~stack.pop()!); break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1A: case 0x1C: case 0x1D: case 0x1E:
      case 0x20: case 0x21: case 0x22: {
        if (sp < 2) return { out, exit: 2 };
        const b = stack.pop()!;
        const a = stack.pop()!;
        let r = 0;
        switch (op) {
          case 0x10: r = (a + b) | 0; break;
          case 0x11: r = (a - b) | 0; break;
          case 0x12: r = Math.imul(a, b); break;
          case 0x13: r = (a === -2147483648 && b === -1) ? -2147483648 : ((a / b) | 0); break;
          case 0x14: r = (b === -1) ? 0 : (a % b); break;
          case 0x15: r = toInt(((a >>> 0) / (b >>> 0)) >>> 0); break;
          case 0x16: r = toInt(((a >>> 0) % (b >>> 0)) >>> 0); break;
          case 0x18: r = a & b; break;
          case 0x19: r = a | b; break;
          case 0x1A: r = a ^ b; break;
          case 0x1C: r = a << (b & 31); break;
          case 0x1D: r = a >> (b & 31); break;
          case 0x1E: r = (a >>> (b & 31)) | 0; break;
          case 0x20: r = a === b ? 1 : 0; break;
          case 0x21: r = a < b ? 1 : 0; break;
          case 0x22: r = (a >>> 0) < (b >>> 0) ? 1 : 0; break;
        }
        if (b === 0 && (op === 0x13 || op === 0x14 || op === 0x15 || op === 0x16)) return { out, exit: 4 };
        stack.push(r | 0);
        break;
      }
      case 0x30: {
        const off = (prog[pc + 1] | (prog[pc + 2] << 8)) << 16 >> 16;
        pc = pc + 3 + off; jumped = true; break;
      }
      case 0x31: case 0x32: {
        if (sp < 1) return { out, exit: 2 };
        const v = stack.pop()!;
        const off = (prog[pc + 1] | (prog[pc + 2] << 8)) << 16 >> 16;
        if ((op === 0x31 && v === 0) || (op === 0x32 && v !== 0)) { pc = pc + 3 + off; jumped = true; }
        break;
      }
      case 0x33: {
        const t = prog[pc + 1] | (prog[pc + 2] << 8);
        if (calls.length >= 64) return { out, exit: 7 };
        calls.push(pc + 3);
        pc = t; jumped = true;
        break;
      }
      case 0x34: if (calls.length === 0) return { out, exit: 8 }; pc = calls.pop()!; jumped = true; break;
      case 0x40: {
        if (sp < 1) return { out, exit: 2 };
        const a = stack.pop()!;
        if (a < 0 || a > 255) return { out, exit: 6 };
        stack.push(mem[a]);
        break;
      }
      case 0x41: {
        if (sp < 2) return { out, exit: 2 };
        const addr = stack.pop()!;
        if (addr < 0 || addr > 255) return { out, exit: 6 };
        const v = stack.pop()!;
        mem[addr] = v;
        break;
      }
      case 0x50: {
        if (sp < 1) return { out, exit: 2 };
        const a = stack.pop()!;
        const s = String(a);
        if (out.length + s.length > OUT_LIMIT) return { out, exit: 11 };
        for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
        break;
      }
      case 0x51: {
        if (sp < 1) return { out, exit: 2 };
        const a = stack.pop()!;
        if (out.length >= OUT_LIMIT) return { out, exit: 11 };
        out.push(a & 0xff);
        break;
      }
      case 0x52: {
        if (sp + 1 > 256) return { out, exit: 3 };
        stack.push(ip < input.length ? input[ip++] : -1);
        break;
      }
      case 0x53: if (sp < 1) return { out, exit: 2 }; return { out, exit: stack.pop()! & 0xff };
    }

    if (!jumped) pc += immLen + 1;
  }
}

const ids = fs.readdirSync(inDir).filter((d) => {
  const p = path.join(inDir, d);
  return fs.existsSync(path.join(p, "program.bin"));
}).sort();

for (const id of ids) {
  const prog = fs.readFileSync(path.join(inDir, id, "program.bin"));
  const inp = fs.existsSync(path.join(inDir, id, "input.bin"))
    ? fs.readFileSync(path.join(inDir, id, "input.bin")) : Buffer.alloc(0);
  const res = run(new Uint8Array(prog), new Uint8Array(inp));
  const dir = path.join(outDir, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stdout.bin"), Buffer.from(res.out));
  fs.writeFileSync(path.join(dir, "exit.txt"), String(res.exit) + "\n");
}