import {loadSettings,saveSettings} from './settings.mjs';
import {ACTIONS,DEFAULT_BINDINGS,keyName,changeBinding} from './bindings.mjs';
export function settingsPanel(container,onClose,onChange){
  const values=loadSettings(),title=document.createElement('h2');title.textContent='Cài đặt';container.replaceChildren(title);let cancelCapture=()=>{};
  const persist=()=>{saveSettings(values);onChange(structuredClone(values));};
  for(const[key,label,min,max,step]of[['volume','Âm lượng',0,1,.01],['sensitivity','Độ nhạy chuột',.25,3,.05]]){
    const row=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input'),output=document.createElement('output');text.textContent=label;input.type='range';input.min=min;input.max=max;input.step=step;input.value=values[key];input.id=`setting-${key}`;
    const update=()=>output.textContent=key==='volume'?`${Math.round(values[key]*100)}%`:`${values[key].toFixed(2)}×`;update();input.addEventListener('input',()=>{values[key]=Number(input.value);persist();update();});row.className='setting-row';row.append(text,input,output);container.append(row);
  }
  for(const[key,label]of[['colorblind','Bảng màu dễ phân biệt'],['reducedMotion','Giảm chuyển động'],['largeText','Chữ lớn ×1.25']]){
    const row=document.createElement('label'),toggle=document.createElement('input');row.className='setting-toggle';toggle.type='checkbox';toggle.id=`setting-${key}`;toggle.checked=values[key];toggle.addEventListener('change',()=>{values[key]=toggle.checked;persist();});row.append(toggle,document.createTextNode(label));container.append(row);
  }
  const heading=document.createElement('h3');heading.textContent='Điều khiển';const list=document.createElement('div'),notice=document.createElement('p');list.className='key-list';notice.id='binding-notice';notice.setAttribute('role','alert');container.append(heading,list,notice);
  function renderKeys(){list.replaceChildren();for(const[action,label]of Object.entries(ACTIONS)){const button=document.createElement('button');button.type='button';button.dataset.bind=action;button.textContent=`${label}: ${keyName(values.bindings[action])}`;
    button.addEventListener('click',()=>{cancelCapture();button.textContent=`${label}: nhấn phím mới…`;notice.textContent='Nhấn một phím; chọn Hủy để dừng.';const listener=e=>{e.preventDefault();e.stopImmediatePropagation();const result=changeBinding(values.bindings,action,e.code);if(!result.ok){notice.textContent=result.error;return;}values.bindings=result.bindings;persist();cancelCapture();notice.textContent='Đã lưu phím mới.';renderKeys();};window.addEventListener('keydown',listener,true);cancelCapture=()=>{window.removeEventListener('keydown',listener,true);cancelCapture=()=>{};};});list.append(button);}}
  renderKeys();const reset=document.createElement('button');reset.type='button';reset.id='reset-bindings';reset.textContent='Khôi phục mặc định';reset.addEventListener('click',()=>{cancelCapture();values.bindings={...DEFAULT_BINDINGS};persist();notice.textContent='Đã khôi phục phím mặc định.';renderKeys();});
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Hủy đổi phím';cancel.addEventListener('click',()=>{cancelCapture();notice.textContent='';renderKeys();});
  const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='Quay lại';close.addEventListener('click',()=>{cancelCapture();onClose();});container.append(reset,cancel,close);
}
