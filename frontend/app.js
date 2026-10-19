var KEY="internhunt-v1",ST=[["wish","Wishlist","--c1"],["applied","Applied","--c2"],["interview","Interview","--c3"],["offer","Offer","--c4"],["rejected","Rejected","--c5"]];
var PREP=["Research the company and its product","Update resume for this role","Prepare 3 project stories","Practice common questions","Write 2 questions to ask them"];
var S={user:null,apps:[]},editId=null,dragId=null;
function $(i){return document.getElementById(i)}
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":s;return d.innerHTML}
var TOKEN=null,MODE="login";
try{TOKEN=localStorage.getItem("ih-token")}catch(e){}
function api(m,u,b){return fetch("/api"+u,{method:m,headers:Object.assign({"Content-Type":"application/json"},TOKEN?{Authorization:"Bearer "+TOKEN}:{}),body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||"Something went wrong");return d})})}
function save(){}
function days(d){if(!d)return null;var t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(d+"T00:00:00")-t)/864e5)}
function iso(n){var d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function mkPrep(){return PREP.map(function(t){return{t:t,d:false}})}
function demo(){
  var a=[["Razorpay","Backend Intern",2,"wish",35000],["Zomato","SDE Intern",9,"wish",40000],["Swiggy","Data Analyst Intern",5,"applied",30000],["Flipkart","Frontend Intern",12,"applied",45000],["Atlassian","Software Intern",-3,"interview",60000],["CRED","Product Design Intern",0,"offer",50000],["Startup X","Web Dev Intern",-10,"rejected",15000]];
  S.apps=a.map(function(x,i){return{id:i+1,company:x[0],role:x[1],deadline:iso(x[2]),status:x[3],stipend:x[4],link:"",notes:"",checklist:x[3]==="interview"?mkPrep():[]}});
}
function show(){
  var on=!!S.user;$("gate").classList.toggle("hide",on);$("app").classList.toggle("hide",!on);
  if(on)render();
}
function render(){
  var q=$("q").value.trim().toLowerCase(),A=S.apps;
  var due=A.filter(function(a){var d=days(a.deadline);return d!==null&&d>=0&&d<=3&&(a.status==="wish"||a.status==="applied")}).length;
  $("hi").textContent="Hi "+S.user.name.split(" ")[0]+", here is your hunt";
  $("hisub").textContent=due?due+(due===1?" deadline is":" deadlines are")+" coming up in the next 3 days.":"No deadlines in the next 3 days. Nice.";
  var cnt={};ST.forEach(function(s){cnt[s[0]]=A.filter(function(a){return a.status===s[0]}).length});
  var applied=A.length-cnt.wish;
  $("stats").innerHTML='<div class="stat"><small>Total tracked</small><div class="n">'+A.length+'</div></div>'+
   '<div class="stat"><small>Applied</small><div class="n">'+applied+'</div></div>'+
   '<div class="stat"><small>Interviews</small><div class="n">'+cnt.interview+'</div></div>'+
   '<div class="stat"><small>Offers</small><div class="n">'+cnt.offer+'</div></div>'+
   '<div class="chart" aria-label="Applications by stage">'+ST.map(function(s){var m=Math.max(1,A.length);return '<div><i style="height:'+Math.round(cnt[s[0]]/m*70+4)+'px;background:var('+s[2]+')"></i><b>'+cnt[s[0]]+'</b>'+s[1]+'</div>'}).join("")+'</div>';
  $("board").innerHTML=ST.map(function(s){
    var L=A.filter(function(a){return a.status===s[0]&&(!q||(a.company+" "+a.role).toLowerCase().indexOf(q)>-1)});
    return '<div class="col" data-st="'+s[0]+'"><h3><i style="background:var('+s[2]+')"></i>'+s[1]+'<span>'+L.length+'</span></h3>'+
    (L.length?L.map(card).join(""):'<div class="empty">Drop a card here</div>')+'</div>';
  }).join("");
  save();
}
function card(a){
  var d=days(a.deadline),t="";
  if(d!==null&&(a.status==="wish"||a.status==="applied")){t=d<0?'<span class="tag warn">Deadline passed</span>':d<=3?'<span class="tag warn">'+(d===0?"Due today":d+" days left")+'</span>':'<span class="tag">'+d+' days left</span>'}
  if(a.stipend)t+='<span class="tag">₹'+Number(a.stipend).toLocaleString("en-IN")+'/mo</span>';
  var done=a.checklist&&a.checklist.length?a.checklist.filter(function(c){return c.d}).length+"/"+a.checklist.length+" prep":"";
  if(done)t+='<span class="tag">'+done+'</span>';
  return '<button class="card" draggable="true" data-id="'+a.id+'"><b>'+esc(a.company)+'</b><small>'+esc(a.role)+'</small><div class="tags">'+t+'</div></button>';
}
function openDlg(id){
  editId=id;var a=S.apps.filter(function(x){return x.id===id})[0]||{};
  $("dt").textContent=id?"Edit application":"Add application";
  $("st").innerHTML=ST.map(function(s){return '<option value="'+s[0]+'">'+s[1]+'</option>'}).join("");
  $("co").value=a.company||"";$("ro").value=a.role||"";$("dl").value=a.deadline||"";$("sp").value=a.stipend||"";
  $("st").value=a.status||"wish";$("lk").value=a.link||"";$("nt").value=a.notes||"";$("err").textContent="";
  $("del").classList.toggle("hide",!id);drawPrep(a.checklist||[],$("st").value==="interview");
  $("dlg").showModal();
}
var tmp=[];
function drawPrep(c,show){
  tmp=c.length?c.map(function(x){return{t:x.t,d:x.d}}):(show?mkPrep():[]);
  $("prep").classList.toggle("hide",!tmp.length);
  $("chks").innerHTML=tmp.map(function(x,i){return '<label class="chk"><input type="checkbox" data-i="'+i+'"'+(x.d?" checked":"")+'> '+esc(x.t)+'</label>'}).join("");
}
$("chks").onchange=function(e){var i=e.target.getAttribute("data-i");if(i!==null)tmp[+i].d=e.target.checked};
$("st").onchange=function(){if($("st").value==="interview"&&!tmp.length)drawPrep([],true)};
$("f").onsubmit=function(e){
  e.preventDefault();
  var o={company:$("co").value.trim(),role:$("ro").value.trim(),deadline:$("dl").value,stipend:$("sp").value,status:$("st").value,link:$("lk").value.trim(),notes:$("nt").value.trim(),checklist:tmp};
  if(!o.company||!o.role){$("err").textContent="Company and role are required.";return}
  var p=editId?api("PUT","/apps/"+editId,o):api("POST","/apps",o);
  p.then(function(r){if(editId)S.apps=S.apps.map(function(a){return a.id===editId?r:a});else S.apps.push(r);$("dlg").close();render()}).catch(function(x){$("err").textContent=x.message});
};
$("cancel").onclick=function(){$("dlg").close()};
$("del").onclick=function(){if(confirm("Delete this application?")){api("DELETE","/apps/"+editId).then(function(){S.apps=S.apps.filter(function(a){return a.id!==editId});$("dlg").close();render()})}};
$("new").onclick=function(){openDlg(null)};
$("q").oninput=render;
$("board").onclick=function(e){var c=e.target.closest(".card");if(c)openDlg(+c.getAttribute("data-id"))};
$("board").ondragstart=function(e){var c=e.target.closest(".card");if(c){dragId=+c.getAttribute("data-id");e.dataTransfer.setData("text/plain",String(dragId))}};
$("board").ondragover=function(e){var c=e.target.closest(".col");if(c){e.preventDefault();c.classList.add("over")}};
$("board").ondragleave=function(e){var c=e.target.closest(".col");if(c)c.classList.remove("over")};
$("board").ondrop=function(e){
  var c=e.target.closest(".col");if(!c||!dragId)return;e.preventDefault();
  var st=c.getAttribute("data-st");
  var ap=S.apps.filter(function(a){return a.id===dragId})[0];
  if(ap){ap.status=st;if(st==="interview"&&!(ap.checklist&&ap.checklist.length))ap.checklist=mkPrep();api("PUT","/apps/"+ap.id,ap).catch(function(){})}
  dragId=null;render();
};
function enter(d){TOKEN=d.token;try{localStorage.setItem("ih-token",TOKEN)}catch(e){}S.user=d.user;return api("GET","/apps").then(function(a){S.apps=a;show()})}
$("gswitch").onclick=function(){MODE=MODE==="login"?"signup":"login";var g=MODE==="signup";$("namewrap").classList.toggle("hide",!g);$("gname").required=g;$("gtitle").textContent=g?"Create account":"Log in";$("gsub").textContent=g?"Create account":"Log in";$("gswitch").textContent=g?"Already have an account? Log in":"New here? Create an account";$("gerr").textContent=""};
$("gform").onsubmit=function(e){e.preventDefault();$("gerr").textContent="";var b={email:$("gmail").value.trim(),password:$("gpass").value};if(MODE==="signup")b.name=$("gname").value.trim();api("POST","/"+MODE,b).then(enter).catch(function(x){$("gerr").textContent=x.message})};
$("gdemo").onclick=function(){api("POST","/signup",{name:"Priya Sharma",email:"demo"+Date.now()+"@internhunt.app",password:"demo1234"}).then(function(d){TOKEN=d.token;return api("POST","/seed",{}).then(function(){return enter(d)})}).catch(function(x){$("gerr").textContent=x.message})};
$("out").onclick=function(){TOKEN=null;S={user:null,apps:[]};try{localStorage.removeItem("ih-token")}catch(e){}show()};
(function(){if(!TOKEN){show();return}api("GET","/me").then(function(u){S.user=u;return api("GET","/apps")}).then(function(a){S.apps=a;show()}).catch(function(){TOKEN=null;show()})})();
