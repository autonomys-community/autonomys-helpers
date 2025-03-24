(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[56],{26:(e,n,t)=>{"use strict";t.r(n),t.d(n,{default:()=>g});var s=t(7876),a=t(4232),c=t(4420),o=t(5019);let l="wss://rpc-0.taurus.subspace.network/ws";async function r(){try{console.log("Connecting to:",l);let e=new c.E(l),n=await o.G.create({provider:e});await n.isReady,console.log("Connected to Subspace RPC.");let t=await n.query.messenger.channels.entries({Domain:0});console.log("Raw entries fetched (".concat(t.length,"):"),t);let s=t.map(e=>{let[n,t]=e,s=t.toHuman();return console.log("Decoded entry:",s),s});return await n.disconnect(),console.log("Disconnected from RPC."),s}catch(e){return console.error("Error during fetchChannels:",e),[]}}var i=t(7867),d=t(8005);function h(e){return Number(e.replace(/,/g,"").trim())}function u(e){let n=h(e.nextInboxNonce),t=h(e.nextOutboxNonce),a=h(e.latestResponseReceivedMessageNonce),c=h(e.maxOutgoingMessages),o=Math.max(0,n-1),l=Math.max(0,t-1),r=o+l,u=Math.max(0,l-a),x=c>0?Math.min(u/c*100,100):0;return(0,s.jsx)(i.A,{className:"mb-3",children:(0,s.jsxs)(i.A.Body,{children:[(0,s.jsxs)(i.A.Title,{children:["Channel #",e.channelId]}),(0,s.jsxs)(i.A.Text,{children:["Status: ",e.state]}),(0,s.jsxs)(i.A.Text,{children:["Capacity: ",c.toLocaleString()]}),(0,s.jsxs)(i.A.Text,{children:["Inbound Messages: ",o.toLocaleString()]}),(0,s.jsxs)(i.A.Text,{children:["Outbound Messages: ",l.toLocaleString()]}),(0,s.jsxs)(i.A.Text,{children:["Total Messages Processed: ",r.toLocaleString()]}),(0,s.jsxs)(i.A.Text,{children:["Pending Messages: ",u.toLocaleString()]}),(0,s.jsx)("div",{children:(0,s.jsx)(d.A,{now:x,label:"".concat(x.toFixed(1),"%")})})]})})}function x(e){let{channels:n}=e;return(0,s.jsx)(s.Fragment,{children:n.map((e,n)=>(0,s.jsx)(u,{...e},n))})}function g(){let[e,n]=(0,a.useState)([]),[t,c]=(0,a.useState)(!0);return((0,a.useEffect)(()=>{r().then(e=>{n(e.filter(e=>"object"==typeof e&&null!==e&&"channelId"in e&&"state"in e&&"nextInboxNonce"in e&&"nextOutboxNonce"in e&&"latestResponseReceivedMessageNonce"in e&&"maxOutgoingMessages"in e)),c(!1)}).catch(e=>{console.error("Fetching channels failed:",e),c(!1)})},[]),t)?(0,s.jsx)("div",{className:"container py-5",children:"Loading channel data..."}):e.length?(0,s.jsxs)("div",{className:"container py-5",children:[(0,s.jsx)("h1",{children:"XDM Channels Status"}),(0,s.jsx)(x,{channels:e})]}):(0,s.jsx)("div",{className:"container py-5",children:"No channel data available."})}},7132:(e,n,t)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/channels",function(){return t(26)}])},7790:()=>{}},e=>{var n=n=>e(e.s=n);e.O(0,[622,685,636,593,792],()=>n(7132)),_N_E=e.O()}]);