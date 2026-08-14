import { describe, it, expect } from 'vitest'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'
const step=(s:GameSim,ms:number)=>{for(let t=0;t<ms;t+=PHYS.stepMs)s.step(PHYS.stepMs)}
function rng(seed:number){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
describe('stuck (final semantics)',()=>{it('probe: stuck ⇔ truly frozen; never fires when a winning move remains',()=>{
  let frozen=0, midgame=0
  for(const lv of LEVELS){const r=rng(lv.id*7919)
    for(let tr=0;tr<40;tr++){const s=new GameSim(lv);const pins=[...lv.pins].sort(()=>r()-0.5);const k=1+Math.floor(r()*pins.length)
      for(let i=0;i<k;i++){s.pull(pins[i].id);step(s,200+Math.floor(r()*600))}
      step(s,20000)
      if(s.status!=='playing')continue
      const wasStuck=s.stuck
      // ground truth: keep pulling everything — can the board still be won?
      for(const p of lv.pins) s.pull(p.id)
      step(s,16000)
      if(wasStuck){
        frozen++
        expect(s.status,`L${lv.id}: stuck fired but pulling rest WON — false positive!`).not.toBe('won')
      } else {
        midgame++
      }
    }}
  console.log(`stuck fired on ${frozen} truly-frozen states; ${midgame} settled mid-game states correctly left alone`)
  // and zero false-stuck along intended solutions
  for(const lv of LEVELS){const s=new GameSim(lv);const sol=[...lv.solution!].sort((a,b)=>a.atMs-b.atMs);let t=0,i=0
    for(let kk=0;kk<900&&s.status==='playing';kk++){while(i<sol.length&&sol[i].atMs<=t){s.pull(sol[i].pin);i++}s.step(PHYS.stepMs);t+=PHYS.stepMs
      expect(s.stuck,`L${lv.id} false-stuck @${t}ms on intended solution`).toBe(false)}
    expect(s.status,`L${lv.id}`).toBe('won')}
})})
