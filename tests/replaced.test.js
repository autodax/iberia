const {wsTransport}=require('../src/net.js');
let opens=0;
class FakeWS{constructor(u){opens++;this.readyState=0;setTimeout(()=>{this.readyState=1;this.onmessage&&this.onmessage({data:JSON.stringify({t:'ready'})});setTimeout(()=>{this.readyState=3;this.onclose&&this.onclose({code:1012,reason:'replaced'})},100)},10)}send(){}close(){}}
(async()=>{const T=wsTransport('http://x',{WebSocket:FakeWS,retryMs:50});let rep=0;const h=await T.host('ABCD',()=>{});h.onreplaced=()=>rep++;await new Promise(r=>setTimeout(r,1500));console.log(opens===1&&rep===1?'PASS host stops (no reconnect loop) when another window takes over':'FAIL replaced host loop',opens,rep);h.close();process.exit(0)})();
