import * as fs from "node:fs";
import * as path from "node:path";
const I=process.env.MAKEFUN_INPUT_DIR??"/input";
const O=process.env.MAKEFUN_OUTPUT_DIR??"/output";
const L=new Uint8Array(256).fill(255);
for(const[a,b]of[[0,7],[16,30],[32,34],[52,52],[64,65],[80,83]])for(let i=a;i<=b;i++)L[i]=0;
L[1]=1;L[2]=4;L[48]=L[49]=L[50]=L[51]=2;
const T=1000000,OL=65536;
function run(p,inp){
  const st=[],ca=[],mem=new Int32Array(256),o=[];
  const rt=n=>({o,e:n}),oj=()=>(p[pc+1]|(p[pc+2]<<8))<<16>>16;
  let pc=0,ip=0,s=0,sp=0;
  while(true){
    if(s>=T)return rt(10);
    if(pc<0||pc>=p.length)return rt(9);
    const op=p[pc],il=L[op];
    if(il===255)return rt(5);
    if(pc+il>=p.length)return rt(9);
    s++;
    sp=st.length;let jumped=false;
    switch(op){
      case 0: return rt(0);
      case 1: if(sp+1>256)return rt(3);{const b=p[pc+1];st.push(b>=128?b-256:b);}break;
      case 2: if(sp+1>256)return rt(3);st.push(p[pc+1]|(p[pc+2]<<8)|(p[pc+3]<<16)|(p[pc+4]<<24));break;
      case 3: if(sp<1)return rt(2);st.pop();break;
      case 4: if(sp<1)return rt(2);if(sp+1>256)return rt(3);st.push(st[sp-1]);break;
      case 5: if(sp<2)return rt(2);{const a=st[sp-1];st[sp-1]=st[sp-2];st[sp-2]=a;}break;
      case 6: if(sp<2)return rt(2);if(sp+1>256)return rt(3);st.push(st[sp-2]);break;
      case 7: if(sp<3)return rt(2);{const a=st[sp-3],b=st[sp-2],c=st[sp-1];st.length-=3;st.push(b,c,a);}break;
      case 23: if(sp<1)return rt(2);st.push((-st.pop()!)|0);break;
      case 27: if(sp<1)return rt(2);st.push(~st.pop()!);break;
      case 16:case 17:case 18:case 19:case 20:case 21:case 22:
      case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
        if(sp<2)return rt(2);
        const b=st.pop()!,a=st.pop()!;
        let r=0;
        switch(op){
          case 16:r=(a+b)|0;break;
          case 17:r=(a-b)|0;break;
          case 18:r=Math.imul(a,b);break;
          case 19:r=(a===-2147483648&&b===-1)?-2147483648:((a/b)|0);break;
          case 20:r=(b===-1)?0:(a%b);break;
          case 21:r=(((a>>>0)/(b>>>0))>>>0)|0;break;
          case 22:r=(((a>>>0)%(b>>>0))>>>0)|0;break;
          case 24:r=a&b;break;
          case 25:r=a|b;break;
          case 26:r=a^b;break;
          case 28:r=a<<(b&31);break;
          case 29:r=a>>(b&31);break;
          case 30:r=(a>>>(b&31))|0;break;
          case 32:r=a===b?1:0;break;
          case 33:r=a<b?1:0;break;
          case 34:r=(a>>>0)<(b>>>0)?1:0;break;
        }
        if(b===0&&op>=19&&op<=22)return rt(4);
        st.push(r|0);
        break;
      }
      case 48: pc=pc+3+oj();jumped=true;break;
      case 49:case 50:{
        if(sp<1)return rt(2);
        const v=st.pop()!;
        if((op===49)===(v===0)){pc=pc+3+oj();jumped=true;}
        break;
      }
      case 51:{
        const t=p[pc+1]|(p[pc+2]<<8);
        if(ca.length>=64)return rt(7);
        ca.push(pc+3);pc=t;jumped=true;break;
      }
      case 52: if(ca.length===0)return rt(8);pc=ca.pop()!;jumped=true;break;
      case 64:{
        if(sp<1)return rt(2);
        const a=st.pop()!;
        if(a<0||a>255)return rt(6);
        st.push(mem[a]);break;
      }
      case 65:{
        if(sp<2)return rt(2);
        const ad=st.pop()!;
        if(ad<0||ad>255)return rt(6);
        const v=st.pop()!;
        mem[ad]=v;break;
      }
      case 80:{
        if(sp<1)return rt(2);
        const a=st.pop()!;
        const s=a+"";
        if(o.length+s.length>OL)return rt(11);
        for(let i=0;i<s.length;i++)o.push(s.charCodeAt(i));
        break;
      }
      case 81:{
        if(sp<1)return rt(2);
        const a=st.pop()!;
        if(o.length>=OL)return rt(11);
        o.push(a&255);break;
      }
      case 82: if(sp+1>256)return rt(3);st.push(ip<inp.length?inp[ip++]:-1);break;
      case 83: if(sp<1)return rt(2);return rt(st.pop()!&255);
    }
    if(!jumped)pc+=il+1;
  }
}
const ids=fs.readdirSync(I).filter(d=>{const q=path.join(I,d);return fs.existsSync(path.join(q,"program.bin"));}).sort();
for(const id of ids){
  const prog=fs.readFileSync(path.join(I,id,"program.bin"));
  const inp=fs.existsSync(path.join(I,id,"input.bin"))?fs.readFileSync(path.join(I,id,"input.bin")):Buffer.alloc(0);
  const r=run(new Uint8Array(prog),new Uint8Array(inp));
  const d=path.join(O,id);
  fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,"stdout.bin"),Buffer.from(r.o));
  fs.writeFileSync(path.join(d,"exit.txt"),r.e+"\n");
}