/* Online rooms use PeerJS for signaling and direct WebRTC data channels.
   The room creator is the host and must stay online for the room to work. */
let netPeer=null,netConnections=new Map(),netHost=false,netJoined=false,netClientId=null,netRoomId=null,netGame=null,netName='',onlineClueMode='auto',onlineCategories=new Set(['Ficção','História','Celebridades']);
const onlineEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
