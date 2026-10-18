(() => {
  'use strict';
  const panel=document.querySelector('#drivePanel'),bridge=window.travelBridge;
  const name='travelalltheworld-state.json',scope='https://www.googleapis.com/auth/drive.appdata';
  let token='',expires=0,fileId='',linked=false,active=false,dirty=false,saving=false,timer=null,client;
  const status=t=>{const el=panel.querySelector('#driveStatus');if(el)el.textContent=t};
  const notice=bridge.notice;
  const hasData=s=>s.places.length||s.events.length||s.expenses.length||s.title!=='我的下一趟旅行';
  function show(){panel.innerHTML=`<p class="sub">${active?'已連接你的 Google 雲端硬碟。旅程修改後會自動備份。':linked?'已連接 Google，請先選擇載入雲端或上傳這台的資料。':'先在有原始收藏的頁面連接 Google，將目前旅程存上去；另一個裝置再連接同一帳號。'}</p><p class="help" id="driveStatus">${active?'自動同步已開啟':linked?'等待選擇旅程版本':'尚未連線，本機資料不會消失'}</p><div class="toolbar"><button class="btn primary" id="driveConnect">${linked?'重新連接 Google':'連接我的 Google 雲端'}</button>${linked?'<button class="btn" id="driveLoad">從雲端載入</button><button class="btn" id="driveSave">將目前資料存到雲端</button>':''}</div><p class="help">旅程存在你自己的 Google Drive 應用程式資料區，不會出現在一般檔案清單，也不會分享給旅伴。網頁重新開啟後可能要點一次「重新連接 Google」才能繼續同步。</p>`}
  async function request(url,options={}){
    if(!token||Date.now()>=expires){linked=false;active=false;show();throw Error('連線已過期，請點「重新連接 Google」')}
    const res=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});
    if(!res.ok){if(res.status===401){linked=false;active=false;show();throw Error('Google 授權已過期，請重新連接')}throw Error(`Google Drive 回應 ${res.status}`)}
    return res;
  }
  async function findCloud(){
    const q=new URLSearchParams({spaces:'appDataFolder',q:`name = '${name}' and trashed = false`,fields:'files(id,name,modifiedTime),nextPageToken',orderBy:'modifiedTime desc',page_size:'100'});
    const result=await (await request('https://www.googleapis.com/drive/v3/files?'+q)).json();
    fileId=result.files?.[0]?.id||'';return fileId;
  }
  async function download(){
    if(!fileId)await findCloud();if(!fileId)return null;
    const data=await (await request(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)).json();
    if(!data||!Array.isArray(data.places)||!Array.isArray(data.events)||!Array.isArray(data.expenses))throw Error('雲端備份格式不正確');
    return data;
  }
  async function loadCloud(ask=true){
    try{status('正在讀取 Google 雲端…');const cloud=await download();
      if(!cloud){status('雲端尚無旅程。請按「將目前資料存到雲端」。');return}
      const local=bridge.read();if(JSON.stringify(local)===JSON.stringify(cloud)){active=true;show();status('本機與雲端資料一致；後續修改會自動備份');return}
      if(ask&&hasData(local)&&!confirm('從 Google 雲端載入會取代這台裝置目前的旅程。請先匯出 JSON 備份。確定載入？')){status('保留本機資料；可選擇上傳或載入');return}
      bridge.replace(cloud);dirty=false;active=true;show();status('已從 Google 雲端載入；後續修改會自動備份');notice('已載入雲端旅程');
    }catch(e){status(e.message);notice('雲端讀取失敗，本機旅程仍在')}
  }
  async function upload(force=false){
    if(!linked||saving||(!active&&!force))return;if(!token||Date.now()>=expires){linked=false;active=false;show();status('授權已到期，請重新連接後上傳');return}
    saving=true;dirty=false;const content=JSON.stringify(bridge.read());status('正在存入 Google 雲端…');
    try{
      if(!fileId)await findCloud();
      if(!fileId){
        const boundary='travel_'+crypto.randomUUID().replaceAll('-','');
        const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,mimeType:'application/json',parents:['appDataFolder']})}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;
        const created=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
        fileId=(await created.json()).id;
      }else await request(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:content});
      active=true;show();status('已存入 Google 雲端');
    }catch(e){dirty=true;status(`尚未同步：${e.message}。請先匯出 JSON 備份`)}
    finally{saving=false;if(dirty&&active&&linked){clearTimeout(timer);timer=setTimeout(()=>upload(),1200)}}
  }
  function connect(){
    client.callback=async response=>{
      if(response.error||!response.access_token){status('Google 授權未完成');return}
      token=response.access_token;expires=Date.now()+(Number(response.expires_in)||3600)*1000-30000;linked=true;active=false;show();
      try{await findCloud();if(fileId)await loadCloud(true);else status('尚無雲端旅程，請按「將目前資料存到雲端」')}
      catch(e){status(e.message)}
      if(dirty)status('這台裝置有尚未同步的變更，請先確認要上傳或載入');
    };
    client.requestAccessToken({prompt:''});
  }
  client=google.accounts.oauth2.initTokenClient({client_id:window.TRAVEL_DRIVE_CLIENT_ID,scope,callback:()=>{}});
  show();
  panel.addEventListener('click',e=>{
    if(e.target.id==='driveConnect')connect();
    if(e.target.id==='driveLoad')loadCloud(true);
    if(e.target.id==='driveSave'){
      if(fileId&&!confirm('將目前旅程存到 Google 雲端，會覆蓋原本的雲端旅程。確定繼續？'))return;
      upload(true)
    }
  });
  window.addEventListener('travel-data-change',()=>{
    if(!active)return;dirty=true;status('有尚未同步的變更…');clearTimeout(timer);timer=setTimeout(()=>upload(),850);
  });
  window.addEventListener('online',()=>{if(active&&dirty)upload()});
})();
