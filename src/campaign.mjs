// Presentation progression; the shared simulation supplies each night's score.
export const NIGHT_INTROS=Object.freeze([
  {name:'Đảo Bến',words:'Ông Đăng: Đốm sáng nhỏ cũng tìm được đường qua sương. Hãy bắt đầu từ Bến, Mây nhé.'},
  {name:'Đảo Cau',words:'Ông Đăng: Hai bờ cùng chờ một ánh đèn. Qua cầu nhớ giữ bước, gặp Gió Lạc nhớ giữ ánh sáng.'},
  {name:'Đảo Chuông',words:'Ông Đăng: Khi ngọn đèn trên tháp sáng lên, tiếng chuông sẽ gọi bình minh về.'}
]);
export function createCampaign(){return{phase:'menu',night:1,wonScores:[null,null,null],totalScore:0,lastResult:null};}
export function beginCampaign(c){Object.assign(c,createCampaign(),{phase:'intro'});return c;}
export function playNight(c){if(c.phase!=='intro')throw Error('Night must be introduced first');c.phase='playing';return c;}
export function recordNightResult(c,result,score){
  if(c.phase!=='playing'||!['won','lost'].includes(result)||!Number.isFinite(score)||score<0)throw Error('Invalid night result');
  c.phase='result';c.lastResult={result,score};if(result==='won')c.wonScores[c.night-1]=score;
  c.totalScore=c.wonScores.reduce((sum,value)=>sum+(value??0),0);return c;
}
export function nextNight(c){if(c.phase!=='result'||c.lastResult?.result!=='won')throw Error('Win this night before continuing');if(c.night===3)c.phase='dawn';else{c.night++;c.phase='intro';c.lastResult=null;}return c;}
export function retryNight(c){if(!['playing','result','paused'].includes(c.phase))throw Error('No night to retry');c.phase='intro';c.lastResult=null;return c;}
export function pauseCampaign(c){if(c.phase==='playing')c.phase='paused';else if(c.phase==='paused')c.phase='playing';return c;}
export function campaignMenu(c){c.phase='menu';return c;}
