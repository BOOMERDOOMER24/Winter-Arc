const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.F||require('path').join(__dirname,'..','index.html'),'utf8');
let GIST=null;
function boot(now,ls,name){
  const dom=new JSDOM(html,{runScripts:"outside-only",url:"https://x.test/#meals"});
  const w=dom.window;
  const RealDate=w.Date;const fixed=new RealDate(now).getTime();
  class FDate extends RealDate{constructor(...a){a.length?super(...a):super(fixed);} static now(){return fixed;}}
  w.Date=FDate;
  for(const k in ls)w.localStorage.setItem(k,JSON.stringify(ls[k]));
  w.localStorage.setItem('wa-sync',JSON.stringify({token:'t',gist:'g'}));
  w.localStorage.setItem('wa-myname',JSON.stringify(name));
  w.fetch=async(url,opt={})=>{
    if(opt.method==='PATCH'){GIST=JSON.parse(JSON.parse(opt.body).files['winter-arc-challenge.json'].content);return {ok:true,json:async()=>({})};}
    return {ok:true,json:async()=>({files:{'winter-arc-challenge.json':{content:JSON.stringify(GIST)}}})};
  };
  w.scrollTo=()=>{};
  const src=html.match(/<script>([\s\S]*)<\/script>/)[1];
  w.eval(src);
  return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ls=w=>k=>JSON.parse(w.localStorage.getItem(k));
(async()=>{
  // 1: existing old-format gist; new client syncs -> adds goalHistory, keeps unknown field
  GIST={app:"winter-arc-challenge",board:{Thom:{"2026-12-01":3100,"2026-12-02":2800},Max:{"2026-12-01":true}},goal:3000,goalTs:0,extra:"keep"};
  let a=boot("2026-12-05T12:00:00",{},"Finn");await wait(300);
  console.log("1 hist:",JSON.stringify(GIST.goalHistory),"extra:",GIST.extra,"goal:",GIST.goal);
  // 2: Finn sets 3500 on Dec 10 -> Dec 1-9 still judged at 3000
  a=boot("2026-12-10T12:00:00",{},"Finn");await wait(300);
  a.document.getElementById('goalIn').value="3500";a.document.getElementById('goalSave').click();await wait(1500);
  console.log("2 hist:",JSON.stringify(GIST.goalHistory.map(e=>[e.from,e.kcal])),"goal:",GIST.goal);
  const vs=[...a.document.querySelectorAll('#vsBox .p')].map(p=>p.querySelector('.who').textContent+"="+p.querySelector('.sc').textContent);
  console.log("2 scores:",vs.join(" "));  // Thom 3100 on 12-01 >=3000 -> 1 hit; Max true -> 1
  // 3: old-version phone overwrites: drops goalHistory, sets goal 3200 newer
  GIST={app:"winter-arc-challenge",board:GIST.board,goal:3200,goalTs:new Date("2026-12-15T09:00:00").getTime()};
  a=boot("2026-12-16T12:00:00",ls(a)("wa-goalhist")?{"wa-goalhist":ls(a)("wa-goalhist")}:{},"Finn");await wait(300);
  console.log("3 hist:",JSON.stringify(GIST.goalHistory.map(e=>[e.from,e.kcal])),"goal:",GIST.goal);
  // 4: fresh phone, no local hist, gist has history -> adopts it
  a=boot("2026-12-16T12:00:00",{},"Finn");await wait(300);
  console.log("4 local hist:",JSON.stringify(ls(a)("wa-goalhist").map(e=>[e.from,e.kcal])),"GOAL shown:",a.document.getElementById('fbGoal').textContent);
  // 5: before start: setting goal replaces seed
  GIST={app:"winter-arc-challenge",board:{},goal:3000,goalTs:0};
  a=boot("2026-11-23T12:00:00",{},"Finn");await wait(300);
  a.document.getElementById('goalIn').value="2800";a.document.getElementById('goalSave').click();await wait(1500);
  console.log("5 hist:",JSON.stringify(GIST.goalHistory.map(e=>[e.from,e.kcal])));
})().catch(e=>console.error("ERR",e));
