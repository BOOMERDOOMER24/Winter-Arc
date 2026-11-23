const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.F||require('path').join(__dirname,'..','index.html'),'utf8');
let GIST=null,writes=0;
function boot(ls,name){
  const dom=new JSDOM(html,{runScripts:"outside-only",pretendToBeVisual:true,url:"https://x.test/#today"});
  const w=dom.window;
  for(const k in ls)w.localStorage.setItem(k,JSON.stringify(ls[k]));
  w.localStorage.setItem('wa-sync',JSON.stringify({token:'t',gist:'g'}));
  w.localStorage.setItem('wa-myname',JSON.stringify(name));
  w.fetch=async(url,opt={})=>{
    if(opt.method==='PATCH'){writes++;GIST=JSON.parse(JSON.parse(opt.body).files['winter-arc-challenge.json'].content);return {ok:true,json:async()=>({})};}
    return {ok:true,json:async()=>({files:{'winter-arc-challenge.json':{content:JSON.stringify(GIST)}}})};
  };
  w.scrollTo=()=>{};const errs=[];w.addEventListener('error',e=>errs.push(e.message));
  w.eval(html.match(/<script>([\s\S]*)<\/script>/)[1]);
  w._errs=errs;return w;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const L=(w,k)=>JSON.parse(w.localStorage.getItem(k));
const t=(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");})();
const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{
  GIST={app:"winter-arc-challenge",board:{Thom:{"2026-12-01":3100}},goal:3000,goalTs:0,goalHistory:[{from:"2026-11-30",kcal:3000,ts:0}],profiles:{Thom:{v:1,sec:{"wa-profile":{v:{goalKg:80},ts:5}},days:{}}}};
  // A: phone1 with existing local data, profile sync first time
  const prof1={goalKg:75,note:"",split:[{t:"Legs",ex:[{nm:"Squat",rx:"3x5"}]}],eatNotes:"",shop:[]};
  let p1=boot({"wa-profile":prof1,"wa-meals":{"2026-12-02":{_x:[{nm:"Pasta",kc:3200}]}},"wa-weights":[{d:"2026-12-01",w:65}]},"Finn");
  await wait(400);
  ok(GIST.profiles.Finn&&GIST.profiles.Finn.sec["wa-profile"].v.split[0].t==="Legs","A: local profile uploaded to gist.profiles.Finn");
  ok(GIST.profiles.Finn.days["2026-12-02"].v._x[0].kc===3200,"A: meal day uploaded");
  ok(GIST.profiles.Thom.sec["wa-profile"].v.goalKg===80,"A: Thom's profile untouched");
  ok(GIST.board.Finn["2026-12-02"]===3200,"A: board column from meals");
  // B: fresh phone2, same name → gets everything
  let p2=boot({},"Finn");await wait(400);
  ok(L(p2,"wa-profile")&&L(p2,"wa-profile").split[0].t==="Legs","B: fresh device restored profile/split");
  ok(L(p2,"wa-weights")[0].w===65,"B: weights restored");
  ok(L(p2,"wa-meals")["2026-12-02"]._x[0].nm==="Pasta","B: meal day restored with item names");
  ok(GIST.board.Finn["2026-12-02"]===3200,"B: board column intact");
  // C: phone2 edits split + logs today; phone1 syncs and receives
  const pr=L(p2,"wa-profile");pr.split.push({t:"Push",ex:[]});
  p2.document.getElementById("xName").value="Döner";p2.document.getElementById("xKc").value="900";p2.document.getElementById("xAdd").click();
  p2.localStorage.setItem("x","1");
  // edit via app's own LS.set path: simulate through restore of backup? use the editor-free path: call through window? use mealState path done; profile via LS: use import
  await wait(1500);
  ok(GIST.profiles.Finn.days[t]&&GIST.profiles.Finn.days[t].v._x[0].kc===900,"C: phone2 today's log pushed");
  p1.document.dispatchEvent(new p1.Event("visibilitychange"));await wait(400);
  ok(L(p1,"wa-meals")[t]&&L(p1,"wa-meals")[t]._x[0].nm==="Döner","C: phone1 received today's log on resume");
  // D: phone1 resets today → phone2 gets empty day
  p1.document.getElementById("mealReset").click();await wait(1500);
  p2.document.dispatchEvent(new p2.Event("visibilitychange"));await wait(400);
  ok(JSON.stringify(L(p2,"wa-meals")[t])==="{}","D: reset propagates to phone2");
  ok(!GIST.board.Finn[t],"D: board today cleared");
  // E: weight logged on phone2 reaches phone1, profile on phone1 not clobbered by empty defaults
  p2.document.getElementById("wInput").value="66.2";p2.document.getElementById("wSave").click();await wait(1500);
  p1.document.dispatchEvent(new p1.Event("visibilitychange"));await wait(400);
  ok(L(p1,"wa-weights").slice(-1)[0].w===66.2,"E: weight from phone2 on phone1");
  ok(L(p1,"wa-profile").split[0].t==="Legs","E: profile kept");
  // F: goal history + unknown field still preserved
  ok(Array.isArray(GIST.goalHistory)&&GIST.goal===3000,"F: goal fields intact");
  ok([p1,p2].every(w=>!w._errs.length),"no JS errors "+[p1,p2].map(w=>w._errs.join(";")).join("|"));
  console.log("writes:",writes);
})().catch(e=>console.error("ERR",e));
