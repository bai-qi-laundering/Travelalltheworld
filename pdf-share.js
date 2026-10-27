(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'NT$ '+Math.round(Number(n)||0).toLocaleString('zh-TW');
  const date=(s,d)=>{const x=new Date(`${s}T12:00:00`);x.setDate(x.getDate()+d-1);return x.toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'short'})};
  let loading;
  function library(){
    if(window.html2pdf)return Promise.resolve();if(loading)return loading;
    loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';s.onload=resolve;s.onerror=()=>reject(Error('PDF 工具無法載入'));document.head.append(s)});
    return loading;
  }
  function itinerary(s){
    return Array.from({length:s.days},(_,i)=>{const day=i+1,events=s.events.filter(e=>e.day===day).sort((a,b)=>(a.time||'').localeCompare(b.time||''));return `<section style="break-inside:avoid"><h2>Day ${day}　${esc(date(s.start,day))}</h2>${events.length?events.map(e=>{const p=s.places.find(x=>x.id===e.placeId);const title=e.kind==='place'?p?.name||'地點':e.kind==='flight'?`✈ ${e.code||'班機'}　${e.from||''} → ${e.to||''}`:`${e.mode||'交通'}　${e.from||''} → ${e.to||''}`;const detail=e.kind==='place'?[p?.address||'',e.note||''].filter(Boolean).join(' · '):[e.arrive?`抵達 ${e.arrive}`:'',e.duration?`${e.duration} 分鐘`:'',e.note||''].filter(Boolean).join(' · ');return `<div class="pdf-row"><b>${esc(e.time||'--:--')}</b><span><strong>${esc(title)}</strong><small>${esc(detail)}</small></span></div>`}).join(''):'<p>尚未安排</p>'}</section>`}).join('');
  }
  function settlement(s){
    const balances=Object.fromEntries(s.members.map(m=>[m,0]));
    for(const e of s.expenses){const v=Number(e.twd)||0;if(!(e.payer in balances))continue;balances[e.payer]+=v;const members=(e.split||[]).filter(m=>m in balances);if(members.length)members.forEach(m=>balances[m]-=v/members.length)}
    const debt=Object.entries(balances).filter(([,v])=>v<-.01).map(([name,v])=>({name,v:-v}));
    const credit=Object.entries(balances).filter(([,v])=>v>.01).map(([name,v])=>({name,v}));let transfers=[];
    while(debt.length&&credit.length){const v=Math.min(debt[0].v,credit[0].v);transfers.push(`${esc(debt[0].name)} → ${esc(credit[0].name)}：${money(v)}`);debt[0].v-=v;credit[0].v-=v;if(debt[0].v<.01)debt.shift();if(credit[0].v<.01)credit.shift()}
    return `<h2>分帳結算</h2><p>${transfers.length?transfers.map(t=>`<div class="pdf-row">${t}</div>`).join(''):'目前無須轉帳'}</p><h2>支出明細</h2><p>共 ${s.expenses.length} 筆 · 合計 ${money(s.expenses.reduce((v,e)=>v+Number(e.twd||0),0))}</p>${s.expenses.map(e=>`<div class="pdf-row"><span><strong>${esc(e.title)}</strong><small>Day ${esc(e.day)} · ${esc(e.payer)} 先付 · ${esc((e.split||[]).join('、'))} 平分</small></span><b>${money(e.twd)}</b></div>`).join('')}`;
  }
  async function create(mode){
    const state=window.travelBridge.read(),label=mode==='itinerary'?'行程表':'分帳單';
    const node=document.createElement('article');node.id='travelPdf';node.style.cssText='width:680px;background:white;color:#17353a;padding:34px 44px;font:15px/1.65 "Noto Sans TC",sans-serif';
    node.innerHTML=`<style>#travelPdf .pdf-row{display:flex;gap:18px;justify-content:space-between;border-bottom:1px solid #dce9e3;padding:9px 0;break-inside:avoid}#travelPdf .pdf-row>span{flex:1}#travelPdf .pdf-row small{display:block;color:#667e78}#travelPdf .pdf-row b{color:#146a5d;white-space:nowrap}#travelPdf h2{font-size:18px;color:#146a5d;margin:26px 0 10px;break-after:avoid}</style><div style="font-size:11px;color:#146a5d;letter-spacing:2px">TRAVELALLTHEWORLD</div><h1 style="font-size:26px;margin:8px 0">${esc(state.title)} · ${label}</h1><div style="color:#667e78">${esc(state.start)} 出發 · ${state.days} 天 · ${new Date().toLocaleDateString('zh-TW')} 匯出</div>${mode==='itinerary'?itinerary(state):settlement(state)}`;
    node.style.position='fixed';node.style.left='0';node.style.top='0';node.style.zIndex='-1';document.body.append(node);
    try{
      await library();await document.fonts?.ready;
      const blob=await window.html2pdf().set({margin:10,image:{type:'jpeg',quality:.93},html2canvas:{scale:2,backgroundColor:'#fff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(node).outputPdf('blob');
      const filename=`${state.title.replace(/[\\/:*?"<>|]/g,'_')}-${label}.pdf`,file=new File([blob],filename,{type:'application/pdf'});
      if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:filename});return}catch(e){if(e.name==='AbortError')return}}
      const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
      window.travelBridge.notice('PDF 已下載，可從「檔案」分享到 LINE');
    }catch(e){window.travelBridge.notice('產生 PDF 失敗，請稍後再試');console.error(e)}finally{node.remove()}
  }
  document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='pdfItinerary')create('itinerary');if(action==='pdfSettlement')create('settlement')});
})();
