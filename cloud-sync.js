import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,doc,getDoc,getDocs,setDoc,updateDoc,collection,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const panel=document.querySelector('#cloudPanel');
const bridge=window.travelBridge;
const config=window.TRAVEL_FIREBASE_CONFIG;
if(!config?.apiKey||!config?.projectId||!config?.appId){
  panel.innerHTML='<p class="sub">雲端同步尚待設定。現有資料仍保存在此瀏覽器；請先匯出 JSON 備份。</p>';
}else{
  const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
  let user=null,tripId='',unsub=null,dirty=false,saving=false,timer=null,tripList=[];
  const id=()=>crypto.randomUUID();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notice=t=>bridge.notify(t);
  const inviteToken=new URLSearchParams(location.search).get('invite');
  const error=e=>{console.error('雲端同步',e);notice('雲端操作失敗，請確認網路與權限設定');};
  function show(){
    if(!user){panel.innerHTML=`<p class="sub">使用同一組 Email 與密碼登入，主畫面與 Safari 就能選取同一份旅程。</p><form id="cloudAuth" class="form"><div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>密碼</label><input name="password" type="password" autocomplete="current-password" minlength="6" required></div><div class="toolbar"><button class="btn primary" name="mode" value="login">登入</button><button class="btn" name="mode" value="register">註冊</button><button class="btn" name="mode" value="reset" formnovalidate>忘記密碼</button></div></form><p class="help">${inviteToken?'登入後會加入朋友分享的旅程。':'登入後可將目前這台裝置的資料存到雲端。'}</p>`;return}
    panel.innerHTML=`<p class="sub">${esc(user.email)} <button class="btn small" id="cloudLogout">登出</button></p><p class="help" id="cloudStatus">${tripId?'已連線 · 變更將自動儲存':'請選擇一份雲端旅程，或將目前資料存上雲端。'}</p><div class="toolbar"><button class="btn primary" id="cloudCreate">${tripList.length?'新增旅程（使用目前資料）':'將目前資料存到雲端'}</button>${tripId?'<button class="btn" id="cloudInvite">LINE 邀請旅伴</button>':''}</div><div id="cloudTrips" class="list">${tripList.map(x=>`<button class="btn" data-trip="${esc(x.id)}" style="justify-content:flex-start;text-align:left">${x.id===tripId?'✓ ':''}${esc(x.title||'未命名旅程')}</button>`).join('')}</div><p class="help">只有已登入且加入旅程的帳號能編輯。請保留 JSON 備份；兩台裝置同時修改同一項時，以最後儲存的版本為準。</p>`;
  }
  function status(t){const el=document.querySelector('#cloudStatus');if(el)el.textContent=t}
  async function listTrips(){const docs=await getDocs(collection(db,'users',user.uid,'trips'));tripList=docs.docs.map(x=>({id:x.id,...x.data()}));show()}
  function stop(){clearTimeout(timer);unsub?.();unsub=null;tripId='';dirty=false;saving=false}
  async function selectTrip(next){
    if(next===tripId)return;stop();tripId=next;localStorage.setItem('travelalltheworld.activeTrip',next);show();status('正在讀取雲端旅程…');
    unsub=onSnapshot(doc(db,'trips',next),snap=>{
      if(!snap.exists()){status('這份旅程不存在或無權讀取');return}
      if(snap.metadata.hasPendingWrites||dirty||saving)return;
      const remote=snap.data().data;
      if(remote){bridge.replace(remote);status('已同步到雲端')}
    },e=>{status('同步中斷，請確認權限與網路');error(e)});
  }
  async function createTrip(){
    const trip=bridge.read(),next=id();
    try{
      await setDoc(doc(db,'trips',next),{ownerId:user.uid,data:trip,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      await setDoc(doc(db,'trips',next,'members',user.uid),{uid:user.uid,joinedAt:serverTimestamp()});
      await setDoc(doc(db,'users',user.uid,'trips',next),{title:trip.title,joinedAt:serverTimestamp()});
      await listTrips();await selectTrip(next);notice('旅程已存到雲端');
    }catch(e){error(e)}
  }
  async function join(token){
    try{
      const invite=await getDoc(doc(db,'invites',token));
      if(!invite.exists())throw Error('邀請不存在');
      const {tripId:next,title}=invite.data();
      await setDoc(doc(db,'trips',next,'members',user.uid),{uid:user.uid,inviteToken:token,joinedAt:serverTimestamp()});
      await setDoc(doc(db,'users',user.uid,'trips',next),{title,joinedAt:serverTimestamp()});
      history.replaceState(null,'',location.pathname+location.hash);
      await listTrips();await selectTrip(next);notice('已加入旅程');
    }catch(e){error(e);notice('邀請失效或無法加入，請朋友重新分享連結')}
  }
  async function shareInvite(){
    try{
      const token=id(),trip=bridge.read();
      await setDoc(doc(db,'invites',token),{tripId,title:trip.title,createdBy:user.uid,createdAt:serverTimestamp()});
      const url=new URL(location.pathname,location.origin);url.searchParams.set('invite',token);
      const message=`一起編輯「${trip.title}」的旅程：${url}`;
      if(navigator.share)await navigator.share({title:trip.title,text:`一起編輯「${trip.title}」的旅程`,url:url.href});
      else{await navigator.clipboard.writeText(message);notice('邀請連結已複製，貼到 LINE 即可')}
    }catch(e){if(e.name!=='AbortError')error(e)}
  }
  async function save(){
    if(!tripId||!user||saving)return;
    saving=true;const target=tripId,data=bridge.read();dirty=false;status('正在存到雲端…');
    try{await updateDoc(doc(db,'trips',target),{data,updatedAt:serverTimestamp()});if(target===tripId)status('已同步到雲端')}
    catch(e){dirty=true;status('尚未同步：請確認網路，先匯出 JSON 備份');error(e)}
    finally{saving=false;if(dirty&&target===tripId)timer=setTimeout(save,1800)}
  }
  window.addEventListener('travel-data-change',()=>{if(!tripId||!user)return;dirty=true;status('有尚未同步的變更…');clearTimeout(timer);timer=setTimeout(save,600)});
  panel.addEventListener('submit',async e=>{
    if(e.target.id!=='cloudAuth')return;e.preventDefault();
    const form=e.target,email=form.elements.namedItem('email').value.trim(),password=form.elements.namedItem('password').value,mode=e.submitter?.value;
    try{
      if(mode==='reset'){if(!email)return notice('先填 Email');await sendPasswordResetEmail(auth,email);return notice('重設密碼郵件已寄出')}
      if(mode==='register')await createUserWithEmailAndPassword(auth,email,password);
      else await signInWithEmailAndPassword(auth,email,password);
    }catch(err){notice(err.code==='auth/email-already-in-use'?'這個 Email 已註冊，請按登入':err.code==='auth/invalid-credential'?'帳號或密碼不正確':'登入失敗，請確認 Email、密碼及 Firebase 設定')}
  });
  panel.addEventListener('click',async e=>{
    if(e.target.id==='cloudLogout'){stop();await signOut(auth)}
    if(e.target.id==='cloudCreate')createTrip();
    if(e.target.id==='cloudInvite')shareInvite();
    const next=e.target.closest('[data-trip]')?.dataset.trip;if(next)selectTrip(next);
  });
  onAuthStateChanged(auth,async next=>{
    stop();user=next;
    if(!user){show();return}
    try{await listTrips();if(inviteToken)await join(inviteToken);
      else{const remembered=localStorage.getItem('travelalltheworld.activeTrip');if(tripList.some(x=>x.id===remembered))await selectTrip(remembered)}
    }catch(e){error(e)}
  });
}
