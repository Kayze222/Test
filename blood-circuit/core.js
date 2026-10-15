export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const integer=(v,max=1e9)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
export const META=[{id:'health',name:'Reinforced vessel',desc:'+10 maximum health per level',icon:'✚'},{id:'speed',name:'Overclocked legs',desc:'+4% movement speed per level',icon:'»'},{id:'fortune',name:'Seed capital',desc:'+25 gold at the start of every run',icon:'◇'}];
export function cleanSave(raw){const s=raw&&typeof raw==='object'?raw:{};return {version:1,shards:integer(s.shards),health:integer(s.health,5),speed:integer(s.speed,5),fortune:integer(s.fortune,5),best:integer(s.best),bestWave:integer(s.bestWave),runs:integer(s.runs)}}
export function metaCost(s,id){return META.some(x=>x.id===id)?6+s[id]*6:Infinity}
export function buyMeta(s,id){const cost=metaCost(s,id);if(s[id]>=5||s.shards<cost||!Number.isFinite(cost))return false;s.shards-=cost;s[id]++;return true}
export const ITEMS=[
{id:'fang',name:'Vampire fang',desc:'Kills restore +4 health. Keep feeding.',rarity:'COMMON',weight:17,icon:'V'},
{id:'trigger',name:'Hair trigger',desc:'Weapons cycle 12% faster per stack.',rarity:'COMMON',weight:17,icon:'↯'},
{id:'edge',name:'Serrated rounds',desc:'+15% weapon damage per stack.',rarity:'COMMON',weight:17,icon:'≋'},
{id:'mint',name:'Blood mint',desc:'+25% gold from every kill per stack.',rarity:'COMMON',weight:13,icon:'◇'},
{id:'wing',name:'Icarus engine',desc:'+35% damage while airborne per stack.',rarity:'RARE',weight:10,icon:'↑'},
{id:'heart',name:'Second heart',desc:'+25 maximum health. Fully heals on pickup.',rarity:'RARE',weight:10,icon:'✚'},
{id:'arc',name:'Tesla marrow',desc:'Hits have a 25% chance to arc to a second enemy.',rarity:'RARE',weight:8,icon:'ϟ'},
{id:'nova',name:'Violent ending',desc:'Kills explode for 25 area damage per stack.',rarity:'EPIC',weight:5,icon:'✳'},
{id:'echo',name:'Echo chamber',desc:'Every third shot repeats per stack, up to 3 echoes.',rarity:'EPIC',weight:2,icon:'≡'},
{id:'phoenix',name:'Phoenix protocol',desc:'Survive a fatal hit. One resurrection per stack.',rarity:'LEGENDARY',weight:2,icon:'◆'},
{id:'velocity',name:'Kinetic bite',desc:'+4% damage per 2 m/s of movement per stack.',rarity:'COMMON',weight:12,icon:'»'},
{id:'shrapnel',name:'Scattercore',desc:'+2 shotgun pellets per stack.',rarity:'COMMON',weight:12,icon:'☷'},
{id:'capacitor',name:'Dash capacitor',desc:'Dashing builds a short-range shockwave.',rarity:'RARE',weight:8,icon:'ϟ'},
{id:'aegis',name:'Afterimage',desc:'Invulnerability lasts longer after dashing.',rarity:'RARE',weight:9,icon:'◈'},
{id:'rocket',name:'Sky engine',desc:'Gain an extra mid-air jump per stack, up to 5.',rarity:'RARE',weight:8,icon:'↑'},
{id:'siphon',name:'Blood battery',desc:'Kills refill dash energy per stack.',rarity:'RARE',weight:9,icon:'✦'},
{id:'catalyst',name:'Lucky circuit',desc:'Chests become 10% cheaper per stack.',rarity:'COMMON',weight:11,icon:'◇'},
{id:'momentum',name:'Rapid cycling',desc:'Moving faster increases fire rate.',rarity:'RARE',weight:8,icon:'↯'},
{id:'coin',name:'Golden hand',desc:'Throw coins more often and chain extra ricochet damage.',rarity:'RARE',weight:8,icon:'◉'},
{id:'defiance',name:'Last stand',desc:'+35% damage per stack below 35% health.',rarity:'EPIC',weight:5,icon:'✚'},
{id:'critical',name:'Deadeye',desc:'Every fifth hit strikes harder; stacks increase the bonus.',rarity:'EPIC',weight:5,icon:'⊕'},
{id:'relay',name:'Return voltage',desc:'Parries shock up to 2 additional nearby enemies.',rarity:'EPIC',weight:5,icon:'ϟ'},
{id:'fracture',name:'Impact fracture',desc:'Ground slams mark nearby enemies for bonus damage.',rarity:'EPIC',weight:5,icon:'▣'},
{id:'ember',name:'Combustion rounds',desc:'Shots ignite enemies for brief damage over time.',rarity:'RARE',weight:8,icon:'✹'},
{id:'guard',name:'Blood shield',desc:'After a parry, briefly ignore incoming damage.',rarity:'RARE',weight:8,icon:'⬡'},
{id:'jackpot',name:'Double or nothing',desc:'Chests have a chance to grant an extra random item.',rarity:'LEGENDARY',weight:2,icon:'◆'},
{id:'glass',name:'Glass reactor',desc:'Deal +45% damage but receive +18% damage per stack.',rarity:'EPIC',weight:4,icon:'△'},
{id:'storm',name:'Killstorm',desc:'Every 8 kills release a damage pulse; stacks strengthen it.',rarity:'LEGENDARY',weight:2,icon:'✳'}
];
export function newRun(s,practice=false){return {hp:100+s.health*10,maxHp:100+s.health*10,gold:25*s.fortune,chestCost:40,items:{},score:0,style:0,kills:0,parries:0,shardsEarned:0,time:0,wave:0,wavesCleared:0,practice,shotCount:0,hitCount:0,abilityProcs:0}}
export function openChest(r,rng=Math.random){if(r.gold<r.chestCost)return null;let roll=clamp(rng(),0,.999999)*ITEMS.reduce((n,i)=>n+i.weight,0);let item=ITEMS.at(-1);for(const it of ITEMS){roll-=it.weight;if(roll<0){item=it;break}}r.gold-=r.chestCost;r.chestCost+=Math.max(5,Math.round(15*(1-.1*(r.items.catalyst||0))));r.items[item.id]=(r.items[item.id]||0)+1;if(item.id==='heart'){r.maxHp+=25;r.hp=r.maxHp}return item}
const ranks=[{label:'D',name:'DORMANT',min:0,color:'#a6a5a4'},{label:'C',name:'CHAOTIC',min:150,color:'#f2e7d5'},{label:'B',name:'BRUTAL',min:350,color:'#40d9c4'},{label:'A',name:'ANARCHIC',min:650,color:'#e5ff42'},{label:'S',name:'SAVAGE',min:1000,color:'#ff9b43'},{label:'SS',name:'SADISTIC',min:1600,color:'#ff5a40'},{label:'SSS',name:'UNHOLY',min:2400,color:'#ff3048'}];
export function rankOf(style){return [...ranks].reverse().find(r=>style>=r.min)||ranks[0]}
export function killReward({air=false,switched=false,special=false}={}){return {style:70+(air?60:0)+(switched?70:0)+(special?120:0),gold:10}}
export function raySphere(o,d,c,r){let x=o.x-c.x,y=o.y-c.y,z=o.z-c.z,b=x*d.x+y*d.y+z*d.z,h=b*b-(x*x+y*y+z*z-r*r);if(h<0)return null;let near=-b-Math.sqrt(h),far=-b+Math.sqrt(h);return far<0?null:Math.max(0,near)}
export function wavePlan(w){const boss=w%5===0;return {boss,count:boss?7+Math.min(14,Math.floor(w/2)):Math.min(54,4+w*3+Math.floor(w/3)*2),health:1+Math.min(w-1,40)*.075,speed:1+Math.min(w-1,30)*.032,aggression:1+Math.min(w-1,35)*.048,eliteChance:Math.min(.66,Math.max(0,w-2)*.038),maxAlive:Math.min(22,7+Math.floor(w/2)),spawnGap:Math.max(.22,1.2-w*.065)}}
export function parryable(origin,forward,p,radius=5){let x=p.x-origin.x,y=p.y-origin.y,z=p.z-origin.z,d=Math.hypot(x,y,z);return d<=radius&&(d<.8||(x*forward.x+y*forward.y+z*forward.z)/d>.25)}
