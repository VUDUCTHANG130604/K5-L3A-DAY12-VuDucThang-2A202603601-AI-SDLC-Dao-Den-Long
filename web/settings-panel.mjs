import {loadSettings,saveSettings} from './settings.mjs';
export function settingsPanel(container,onClose,onChange){
  const values=loadSettings(),title=document.createElement('h2');title.textContent='Cài đặt';container.replaceChildren(title);
  for(const [key,label,min,max,step]of [['volume','Âm lượng',0,1,.01],['sensitivity','Độ nhạy chuột',.25,3,.05]]){
    const row=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input'),output=document.createElement('output');text.textContent=label;
    input.type='range';input.min=min;input.max=max;input.step=step;input.value=values[key];input.id=`setting-${key}`;
    const update=()=>{output.textContent=key==='volume'?`${Math.round(values[key]*100)}%`:`${values[key].toFixed(2)}×`;};update();
    input.addEventListener('input',()=>{values[key]=Number(input.value);saveSettings(values);update();onChange({...values});});row.className='setting-row';row.append(text,input,output);container.append(row);
  }
  const row=document.createElement('label'),toggle=document.createElement('input'),text=document.createElement('span');row.className='setting-toggle';toggle.type='checkbox';toggle.id='setting-colorblind';toggle.checked=values.colorblind;text.textContent='Bảng màu dễ phân biệt';toggle.addEventListener('change',()=>{values.colorblind=toggle.checked;saveSettings(values);onChange({...values});});row.append(toggle,text);container.append(row);
  const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='Quay lại';close.addEventListener('click',onClose);container.append(close);
}
