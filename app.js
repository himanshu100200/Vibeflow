const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("vibeflow_"+key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem("vibeflow_"+key, JSON.stringify(value)); }
};
let apiKey = localStorage.getItem("vibeflow_api_key") || "";
let results = [], queue = [], queueIndex = -1, player = null, playerReady = false, currentVideo = null;
let playlists = store.get("playlists", []), liked = store.get("liked", []), history = store.get("history", []);
let toastTimer;
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setView(name){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));$(name+"View").classList.add("active-view");document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));if(name==="library")renderLibrary();if(name==="liked")renderLiked();window.scrollTo(0,0);}
document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
function updateApiStatus(){ $("apiStatus").textContent=apiKey?"YouTube search connected":"Search setup needed"; }
function openSettings(){ $("apiKeyInput").value=apiKey; $("settingsModal").classList.add("open"); }
$("settingsOpen").onclick=openSettings;$("settingsClose").onclick=()=>$("settingsModal").classList.remove("open");
$("saveKey").onclick=()=>{apiKey=$("apiKeyInput").value.trim();if(!apiKey){toast("Paste your YouTube API key first");return;}localStorage.setItem("vibeflow_api_key",apiKey);$("settingsModal").classList.remove("open");updateApiStatus();toast("API key saved on this device");};
$("clearKey").onclick=()=>{apiKey="";localStorage.removeItem("vibeflow_api_key");$("apiKeyInput").value="";updateApiStatus();toast("API key cleared");};
function goSearch(q=""){setView("search");if(q){$("searchInput").value=q;searchYouTube(q);}else $("searchInput").focus();}
$("heroExplore").onclick=()=>goSearch();$("startSearch").onclick=()=>goSearch();$("emptySearch").onclick=()=>goSearch();
document.querySelectorAll(".mood-card").forEach(b=>b.onclick=()=>goSearch(b.dataset.query));
document.querySelectorAll("[data-search]").forEach(b=>b.onclick=()=>goSearch(b.dataset.search));
$("searchForm").addEventListener("submit",e=>{e.preventDefault();const q=$("searchInput").value.trim();if(q)searchYouTube(q);});
async function searchYouTube(query){
 if(!apiKey){openSettings();toast("Add a YouTube Data API key to enable automatic search");return;}
 $("resultsTitle").textContent=`Results for “${query}”`; $("resultCount").textContent="Searching…";$("results").innerHTML='<div class="placeholder-state"><span>♫</span><b>Finding your sound…</b></div>';
 try{
  const url=new URL("https://www.googleapis.com/youtube/v3/search");url.search=new URLSearchParams({part:"snippet",q:query,type:"video",videoCategoryId:"10",maxResults:"24",key:apiKey}).toString();
  const res=await fetch(url);const data=await res.json();if(!res.ok)throw new Error(data.error?.message||"YouTube search failed");
  results=(data.items||[]).filter(x=>x.id?.videoId).map(x=>({id:x.id.videoId,title:x.snippet.title,channel:x.snippet.channelTitle,thumb:x.snippet.thumbnails?.medium?.url||x.snippet.thumbnails?.default?.url}));
  $("resultCount").textContent=`${results.length} results`;renderResults();
 }catch(err){$("resultCount").textContent="";$("results").innerHTML=`<div class="placeholder-state"><span>!</span><b>Couldn't load results</b><p>${escapeHtml(err.message)}. Check your API key, quota and domain restrictions in Google Cloud.</p></div>`;}
}
function cardHTML(t,i){return `<article class="track-card"><img class="track-thumb" src="${escapeHtml(t.thumb)}" alt="" loading="lazy"><h3 title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</h3><p>${escapeHtml(t.channel)}</p><div class="track-actions"><button class="card-play" data-play="${i}">▶ Play</button><button data-like="${i}" title="Like">${liked.some(x=>x.id===t.id)?"♥":"♡"}</button><button data-add="${i}" title="Add to playlist">＋</button></div></article>`;}
function renderResults(){$("results").innerHTML=results.length?results.map(cardHTML).join(""):'<div class="placeholder-state"><span>♫</span><b>No results found</b><p>Try another search phrase.</p></div>';bindTrackButtons($("results"));}
function bindTrackButtons(root){root.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>playFromResults(+b.dataset.play));root.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>toggleLike(results[+b.dataset.like]));root.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addTrackToPlaylist(results[+b.dataset.add]));}
function onYouTubeIframeAPIReady(){player=new YT.Player("youtubePlayer",{height:"1",width:"1",videoId:"",playerVars:{autoplay:0,controls:0,playsinline:1,rel:0},events:{onReady:()=>{playerReady=true;},onStateChange:onPlayerStateChange,onError:()=>toast("This video cannot be played. Try another result.")}});}
window.onYouTubeIframeAPIReady=onYouTubeIframeAPIReady;
function playFromResults(i){queue=results.slice();queueIndex=i;playTrack(queue[i]);}
function playTrack(t){if(!t)return;currentVideo=t;$("nowTitle").textContent=t.title;$("nowChannel").textContent=t.channel;$("nowThumb").src=t.thumb;$("likeCurrent").textContent=liked.some(x=>x.id===t.id)?"♥":"♡";history=[t,...history.filter(x=>x.id!==t.id)].slice(0,40);store.set("history",history);if(playerReady){player.loadVideoById(t.id);$("playPause").textContent="Ⅱ";}else toast("Player is loading — press play again in a moment");}
function onPlayerStateChange(e){if(e.data===YT.PlayerState.PLAYING)$("playPause").textContent="Ⅱ";if(e.data===YT.PlayerState.PAUSED||e.data===YT.PlayerState.ENDED)$("playPause").textContent="▶";if(e.data===YT.PlayerState.ENDED)nextTrack();}
$("playPause").onclick=()=>{if(!currentVideo){if(results.length)playFromResults(0);else goSearch();return;}if(!playerReady)return;const s=player.getPlayerState();if(s===YT.PlayerState.PLAYING)player.pauseVideo();else player.playVideo();};
function nextTrack(){if(queue.length&&queueIndex<queue.length-1){queueIndex++;playTrack(queue[queueIndex]);}else toast("End of current search results");}
function prevTrack(){if(queue.length&&queueIndex>0){queueIndex--;playTrack(queue[queueIndex]);}else if(playerReady)player.seekTo(0,true);}
$("nextTrack").onclick=nextTrack;$("prevTrack").onclick=prevTrack;
$("likeCurrent").onclick=()=>{if(currentVideo)toggleLike(currentVideo);};
function toggleLike(t){if(!t)return;const exists=liked.some(x=>x.id===t.id);liked=exists?liked.filter(x=>x.id!==t.id):[t,...liked];store.set("liked",liked);$("likeCurrent").textContent=currentVideo&&liked.some(x=>x.id===currentVideo.id)?"♥":"♡";renderResults();renderLiked();toast(exists?"Removed from Liked Songs":"Added to Liked Songs");}
function renderLiked(){$("likedCount").textContent=`${liked.length} ${liked.length===1?"song":"songs"}`;$("likedContent").innerHTML=liked.length?liked.map((t,i)=>`<div class="list-track"><img src="${escapeHtml(t.thumb)}"><div><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.channel)}</small></div><button data-liked-play="${i}">▶</button></div>`).join(""):'<div class="placeholder-state"><span>♥</span><b>Your liked songs will appear here</b><p>Tap the heart on any track to save it.</p></div>';$("likedContent").querySelectorAll("[data-liked-play]").forEach(b=>b.onclick=()=>{queue=liked.slice();queueIndex=+b.dataset.likedPlay;playTrack(queue[queueIndex]);});}
function renderLibrary(filter="all"){document.querySelectorAll("[data-library]").forEach(b=>b.classList.toggle("active",b.dataset.library===filter));let html="";if(filter==="all"||filter==="playlists")html+=playlists.map((p,i)=>`<article class="track-card"><div class="track-thumb playlist-cover" style="display:grid;place-items:center;font-size:45px;background:linear-gradient(135deg,#614a9c,#28203e)">♫</div><h3>${escapeHtml(p.name)}</h3><p>${p.tracks.length} saved tracks</p><div class="track-actions"><button data-open-playlist="${i}">Open</button><button data-delete-playlist="${i}">×</button></div></article>`).join("");if(filter==="all"||filter==="liked")html+=liked.map((t,i)=>`<article class="track-card"><img class="track-thumb" src="${escapeHtml(t.thumb)}"><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.channel)}</p><div class="track-actions"><button class="card-play" data-library-play="${i}">▶ Play</button></div></article>`).join("");$("libraryContent").innerHTML=html||'<div class="placeholder-state"><span>▤</span><b>Nothing here yet</b><p>Like tracks or create a playlist to build your library.</p></div>';bindLibraryButtons();}
document.querySelectorAll("[data-library]").forEach(b=>b.onclick=()=>renderLibrary(b.dataset.library));
function bindLibraryButtons(){$("libraryContent").querySelectorAll("[data-open-playlist]").forEach(b=>b.onclick=()=>openPlaylist(+b.dataset.openPlaylist));$("libraryContent").querySelectorAll("[data-delete-playlist]").forEach(b=>b.onclick=()=>{playlists.splice(+b.dataset.deletePlaylist,1);store.set("playlists",playlists);renderLibrary();renderPlaylistNav();});$("libraryContent").querySelectorAll("[data-library-play]").forEach(b=>b.onclick=()=>{queue=liked.slice();queueIndex=+b.dataset.libraryPlay;playTrack(queue[queueIndex]);});}
function renderPlaylistNav(){$("playlistNav").innerHTML=playlists.map((p,i)=>`<button data-nav-playlist="${i}">♫ ${escapeHtml(p.name)}</button>`).join("");$("playlistNav").querySelectorAll("button").forEach(b=>b.onclick=()=>openPlaylist(+b.dataset.navPlaylist));}
function openPlaylist(i){const p=playlists[i];if(!p)return;setView("library");$("libraryContent").innerHTML=`<div class="page-title"><span class="eyebrow">PLAYLIST</span><h1>${escapeHtml(p.name)}</h1><p>${p.tracks.length} tracks</p></div>`+(p.tracks.length?p.tracks.map((t,j)=>`<div class="list-track"><img src="${escapeHtml(t.thumb)}"><div><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.channel)}</small></div><button data-p-play="${j}">▶</button></div>`).join(""):'<p class="muted">Add songs from search results using the + button.</p>');$("libraryContent").querySelectorAll("[data-p-play]").forEach(b=>b.onclick=()=>{queue=p.tracks;queueIndex=+b.dataset.pPlay;playTrack(queue[queueIndex]);});}
function addTrackToPlaylist(t){if(!playlists.length){toast("Create a playlist first");$("playlistModal").classList.add("open");return;}const p=playlists[0];if(!p.tracks.some(x=>x.id===t.id)){p.tracks.push(t);store.set("playlists",playlists);toast(`Added to ${p.name}`);}else toast("Already in playlist");}
$("newPlaylist").onclick=()=>$("playlistModal").classList.add("open");$("playlistClose").onclick=()=>$("playlistModal").classList.remove("open");
$("createPlaylist").onclick=()=>{const name=$("playlistName").value.trim();if(!name){toast("Enter a playlist name");return;}playlists.push({name,tracks:[]});store.set("playlists",playlists);$("playlistName").value="";$("playlistModal").classList.remove("open");renderPlaylistNav();renderLibrary();toast("Playlist created");};
$("backBtn").onclick=()=>history.length?window.history.back():setView("home");$("forwardBtn").onclick=()=>window.history.forward();
$("queueBtn").onclick=()=>toast(queue.length?`${queue.length} tracks in current search queue`:"Search and play music to build a queue");
updateApiStatus();renderPlaylistNav();renderLiked();renderLibrary();
