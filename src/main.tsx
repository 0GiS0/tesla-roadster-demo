import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useProgress } from '@react-three/drei';
import { Scene } from './Scene';
import { advance } from './scenario';
import { buildSceneUrl,defaultScene,sceneCatalog,sceneFromHash,sceneHashFor,sourceLabel } from './sceneCatalog';
import { copyShareLink } from './share';
import { createMemeInvite, inviteMotion, invitesEnabled, type MemeInvite } from './memeInvite';
import './style.css';
class SceneBoundary extends Component<{children:React.ReactNode;onError:()=>void},{error:boolean}>{state={error:false};componentDidCatch(){this.props.onError()}static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<div className="fallback"><span className="eyebrow">NO SE HA PODIDO CARGAR LA ESCENA</span><h2>Volvamos a intentarlo.</h2><p>Comprueba la conexión y recarga para recuperar el modelo 3D.</p><button onClick={()=>location.reload()}>Recargar escena ↗</button></div>:this.props.children}}
function supports3D(){try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}}
const supported=supports3D();
const memeCount=sceneCatalog.filter(scene=>scene.mode==='meme').length;
const invitesOn=invitesEnabled(location.search,navigator.webdriver===true);
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
function sessionStore(){try{return window.sessionStorage}catch{return null}}
const clock=(n:number)=>`0:${String(Math.floor(n)).padStart(2,'0')}`;
function Icon({name}:{name:'play'|'pause'|'reset'|'camera'}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{name==='play'?<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>:name==='pause'?<><path d="M8 5v14M16 5v14" strokeWidth="3"/></>:name==='reset'?<><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>:<><path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/></>}</svg>}
function Loading(){const {active,progress}=useProgress();return active?<div className="loading" role="status"><span className="loader"/>Preparando la pista <span>{Math.round(progress)}%</span></div>:null}
function App(){
 const [definition,setDefinition]=useState(()=>sceneFromHash(location.hash));
 const [playback,setPlayback]=useState({time:0,playing:false});
 const [cameraReset,setCameraReset]=useState(0);
 const [ready,setReady]=useState(false);
 const [shareMessage,setShareMessage]=useState('');
 const [shareFallback,setShareFallback]=useState(false);
 const [inviteVisible,setInviteVisible]=useState(false);
 const [endCardDismissed,setEndCardDismissed]=useState(false);
 const invite=useRef<MemeInvite|null>(null);
 const last=useRef(0);
 useEffect(()=>{
  const controller=createMemeInvite({enabled:invitesOn,storage:sessionStore(),onShow:()=>setInviteVisible(true),onHide:()=>setInviteVisible(false)});
  invite.current=controller;
  return()=>controller.dispose();
 },[]);
 const chooseDefinition=useCallback((next:ReturnType<typeof sceneFromHash>)=>{
  setDefinition(next);setEndCardDismissed(false);setPlayback({time:0,playing:false});setCameraReset(n=>n+1);setShareMessage('');setShareFallback(false);
 },[]);
 useEffect(()=>{
  const onHash=()=>chooseDefinition(sceneFromHash(location.hash));
  window.addEventListener('hashchange',onHash);
  return()=>window.removeEventListener('hashchange',onHash);
 },[chooseDefinition]);
 useEffect(()=>{
  if(!playback.playing)return;
  let id:number;last.current=performance.now();
  const tick=(now:number)=>{
   const delta=Math.min((now-last.current)/1000,.1);last.current=now;
   setPlayback(p=>advance(p.time,delta,p.playing,definition.scenario.duration));
   id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(id);
 },[playback.playing,definition]);
 const onReady=useCallback(()=>setReady(true),[]);
 const onError=useCallback(()=>{setReady(false);setPlayback(p=>({...p,playing:false}))},[]);
 const {scenario}=definition;
 const duration=scenario.duration;
 const phase=scenario.evaluate(playback.time).phase;
 const isMeme=definition.mode==='meme';
 const memeScenes=sceneCatalog.filter(scene=>scene.mode==='meme');
 const finished=!isMeme&&playback.time>=duration;
 const showEndCard=invitesOn&&finished&&!endCardDismissed&&ready;
 const showInvite=inviteVisible&&!isMeme;
 useEffect(()=>{if(finished)invite.current?.trigger()},[finished]);
 useEffect(()=>{if(isMeme)invite.current?.dismiss()},[isMeme]);
 useEffect(()=>{
  if(!showInvite&&!showEndCard)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){invite.current?.dismiss();setEndCardDismissed(true)}};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[showInvite,showEndCard]);
 const enterMeme=()=>{invite.current?.dismiss();selectScene(memeScenes[0])};
 const toggle=()=>setPlayback(p=>({time:p.time>=duration?0:p.time,playing:!p.playing}));
 const selectScene=(target:typeof defaultScene)=>{
  const hash=sceneHashFor(target);
  if(location.hash!==hash)location.hash=hash;
  else chooseDefinition(target);
 };
 const shareUrl=buildSceneUrl(location.origin,import.meta.env.BASE_URL,definition,new URLSearchParams(location.search).has('debug'));
 const copyLink=async()=>{
  const copied=await copyShareLink(shareUrl,navigator.clipboard);
  setShareFallback(!copied);
  setShareMessage(copied?'Enlace copiado.':'Selecciona y copia el enlace.');
 };

 return <main className={isMeme?'meme-mode':''}>
  <header>
   <a className="wordmark" href={import.meta.env.BASE_URL} aria-label="Roadster, inicio">ROADSTER<span className="wordmark-line"/></a>
   <div className="header-meta"><span className="status-dot"/> PRESENTACIÓN · 2026</div>
   <div className="mode-anchor">
    <button className={`mode-toggle${showInvite?` inviting ${inviteMotion(reducedMotion())}`:''}`} aria-pressed={isMeme} title={isMeme?'Salir del Modo MEME':undefined} onClick={()=>isMeme?selectScene(defaultScene):enterMeme()}>Modo MEME{!isMeme&&<span className="mode-count" aria-label={`, ${memeCount} memes`}>{memeCount}</span>}</button>
    <div className="invite-live" aria-live="polite">{showInvite&&<div className="meme-invite" role="note">
     <p>¿Y si el Roadster hiciera otras cosas? <button className="invite-link" onClick={enterMeme}>Prueba el Modo MEME →</button></p>
     <button className="invite-close" aria-label="Cerrar invitación" onClick={()=>invite.current?.dismiss()}>×</button>
    </div>}</div>
   </div>
   <span className="edition">ESTUDIO DE MOVIMIENTO <span>01 / 02</span></span>
  </header>
  <section className={`workspace ${isMeme?'meme-workspace':''}`} aria-label="Escena 3D interactiva de la maniobra del Roadster">
   {isMeme&&<aside className="scene-menu">
    <span className="eyebrow">CATÁLOGO MEME</span>
    <h2>Deja volar la imaginación</h2>
    <nav className="scene-select" aria-label="Seleccionar escena meme">
     {memeScenes.map(scene=><button key={scene.key} className={scene===definition?'selected':''} aria-pressed={scene===definition} onClick={()=>selectScene(scene)}>
      <span>{scene.copy.label}</span><strong>{scene.copy.title}</strong><small>{scene.copy.summary}</small>
     </button>)}
    </nav>
    <label className="mobile-meme-select">
     <span>Elegir escena</span>
     <select aria-label="Seleccionar meme" value={definition.key} onChange={event=>{
      const scene=memeScenes.find(item=>item.key===event.currentTarget.value);
      if(scene)selectScene(scene);
     }}>
      {memeScenes.map(scene=><option key={scene.key} value={scene.key}>{scene.copy.title}</option>)}
     </select>
    </label>
   </aside>}
   <div className="viewer-column">
    {isMeme&&<div className="viewer-toolbar">
     <div className="source-card">
      <span className="eyebrow">INSPIRACIÓN</span>
      <a href={definition.source?.url} target="_blank" rel="noreferrer">{definition.source&&sourceLabel(definition.source)} ↗</a>
     </div>
     <div className="share-control">
      <button onClick={copyLink}>Copiar enlace</button>
      <span className="share-status" role="status">{shareMessage}</span>
      {shareFallback&&<input aria-label="Enlace para compartir" readOnly onFocus={e=>e.currentTarget.select()} value={shareUrl}/>}
     </div>
    </div>}
    <div className={`viewer-stage ${isMeme?'meme-viewer':''}`}>
     {!isMeme&&<div className="intro">
      <div className="eyebrow"><span/> MÁS ALLÁ DEL ASFALTO</div>
      <h1>El suelo era<br/>solo el principio.</h1>
      <p>Una rampa. Un impulso. Otra dimensión.</p>
     </div>}
     <SceneBoundary onError={onError}>
      {supported?<Scene time={playback.time} playing={playback.playing} cameraReset={cameraReset} onReady={onReady} definition={definition}/>:<div className="fallback">
       <span className="eyebrow">EXPERIENCIA 3D</span><h2>Necesitamos un poco más de potencia.</h2>
       <p>Abre esta página en un navegador con WebGL 2 y aceleración gráfica activada.</p>
      </div>}
     </SceneBoundary>
     {supported&&<Loading/>}
     <p className="keyboard-hint" id="camera-keyboard-help">Cámara: flechas para girar · + / − para acercar o alejar · Tab para salir</p>
     <div className="end-live" aria-live="polite">{showEndCard&&<div className="end-card" role="note">
      <p>Fin de la maniobra. ¿Lo vemos en versión meme?</p>
      <div><button className="end-cta" onClick={enterMeme}>Entrar en Modo MEME</button><button className="invite-close" aria-label="Cerrar aviso de fin" onClick={()=>setEndCardDismissed(true)}>×</button></div>
     </div>}</div>
     {!isMeme&&<>
      <div className="scene-label"><span className="cross">+</span><div>RAMPA DE PRUEBAS<span>RECREACIÓN INTERACTIVA</span></div></div>
      <div className="interaction-hint"><span>↔</span> Arrastra para explorar <i/> Pellizca para acercar</div>
     </>}
    </div>
   </div>
  </section>
  <footer className="console">
   <div className="phase"><span className="eyebrow">LA MANIOBRA</span><span className="phase-title" aria-live="polite">{phase}</span></div>
   <div className="transport">
    <div className="transport-top">
     <button className="primary" disabled={!ready||!supported} onClick={toggle}><Icon name={playback.playing?'pause':'play'}/>{playback.playing?'Pausar':playback.time>=duration?'Repetir':'Reproducir'}</button>
     <button className="icon-button" disabled={!ready} aria-label="Reiniciar maniobra" title="Reiniciar maniobra" onClick={()=>setPlayback({time:0,playing:false})}><Icon name="reset"/></button>
     <span className="time"><strong>{clock(playback.time)}</strong><span>/</span>{clock(duration)}</span>
    </div>
    <input className="timeline" disabled={!ready} aria-label="Tiempo de la maniobra" aria-valuetext={`${Math.floor(playback.time)} segundos de ${duration}`} type="range" min="0" max={duration} step="0.01" value={playback.time} onChange={e=>setPlayback(p=>({...p,time:Number(e.target.value),playing:p.playing&&Number(e.target.value)<duration}))} style={{'--progress':`${playback.time/duration*100}%`} as React.CSSProperties}/>
    <div className="timeline-labels"><span>{isMeme?'APROXIMACIÓN':'SUBIDA'}</span><span>VUELO</span><span>ATERRIZAJE</span></div>
   </div>
   <button className="camera-button" aria-label="Restablecer cámara" disabled={!ready} onClick={()=>setCameraReset(n=>n+1)}><Icon name="camera"/><span>Restablecer cámara</span></button>
  </footer>
  <div className="disclaimer"><span>Recreación artística independiente. Sin afiliación con Tesla.</span><span>EXPLORA LO IMPOSIBLE <span className="red">↗</span></span></div>
 </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
