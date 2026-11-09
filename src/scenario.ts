import { Quaternion, Euler } from 'three';
export const RADIUS = 7;
export const WHEEL_RADIUS = .44;
export const HALF_WHEELBASE = 1.47;
export const DURATION = 28;
export type Pose = { position: [number, number, number]; quaternion: [number, number, number, number]; wheelAngle: number; vapor: number; phase: string; speed: number };
export interface Scenario { id: string; title: string; duration: number; evaluate(time: number): Pose }
const clamp = (n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth = (n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
export function wheelPath(s:number):[number,number] {
 const r=RADIUS-WHEEL_RADIUS;
 return s<=0 ? [s,WHEEL_RADIUS] : [r*Math.sin(s/r),RADIUS-r*Math.cos(s/r)];
}
/** Locate two wheel axles on the offset surface, preserving the rigid wheelbase even across the floor join. */
export function contactPose(s:number) {
 let low=HALF_WHEELBASE,high=1.7;
 for(let i=0;i<25;i++){const h=(low+high)/2,a=wheelPath(s-h),b=wheelPath(s+h);if(Math.hypot(b[0]-a[0],b[1]-a[1])<2*HALF_WHEELBASE)low=h;else high=h;}
 const h=(low+high)/2,rear=wheelPath(s-h),front=wheelPath(s+h);
 return {position:[(rear[0]+front[0])/2,(rear[1]+front[1])/2,0] as [number,number,number],angle:Math.atan2(front[1]-rear[1],front[0]-rear[0]),rear,front};
}
const top=(RADIUS-WHEEL_RADIUS)*Math.PI*170/180;
function state(t:number){
 if(t<13)return {s:-9+(top+9)*smooth(t/13),phase:'Subida',vapor:0};
 return {s:top,phase:t<18?'Giro para volar':t<19?'Vuelo controlado':t<DURATION?'Aterrizaje':'Maniobra completada',vapor:t<26?Math.min(1,(t-13)/1.2):1-smooth((t-26)/1.5)};
}
export const rampFlight:Scenario={id:'ramp-flight',title:'Rampa · Vuelo · Aterrizaje',duration:DURATION,evaluate(time){
 const t=clamp(time,0,DURATION),st=state(t),contact=contactPose(st.s);let position=contact.position,angle=contact.angle;
 if(t>=13){const a=smooth((t-13)/5),b=smooth((t-19)/8);position=[contact.position[0]+(-10-contact.position[0])*a,contact.position[1]+(11.5-contact.position[1])*a-(11.5-WHEEL_RADIUS)*b,0];angle=contact.angle*(1-a);}
 const q=new Quaternion().setFromEuler(new Euler(0,0,angle));
 const dt=.01;const before=state(Math.max(0,t-dt)).s,after=state(Math.min(13,t+dt)).s;
 return {position,quaternion:q.toArray() as Pose['quaternion'],wheelAngle:-st.s/WHEEL_RADIUS,vapor:clamp(st.vapor),phase:st.phase,speed:t<13?Math.abs(after-before)/(2*dt):0};
}};
const smoothStep=(n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
export const potholeFlight:Scenario={id:'bache-volador',title:'Bache volador',duration:12,evaluate(time){
 const t=clamp(time,0,12);let x:number,y=WHEEL_RADIUS,phase='Aproximación',wheelAngle:number,vapor=0;
 if(t<3){x=-12+5*smoothStep(t/3);wheelAngle=-(x+12)/WHEEL_RADIUS;}
 else if(t<5){x=-7;y=WHEEL_RADIUS+4*smoothStep((t-3)/2);wheelAngle=-5/WHEEL_RADIUS;phase='Despegue';vapor=smoothStep((t-3)/.8);}
 else if(t<8){const u=(t-5)/3;x=-7+14*smoothStep(u);y=WHEEL_RADIUS+4;wheelAngle=-5/WHEEL_RADIUS;phase='Cruce del bache';vapor=1;}
 else if(t<10){x=7;y=WHEEL_RADIUS+4*(1-smoothStep((t-8)/2));wheelAngle=-5/WHEEL_RADIUS;phase='Aterrizaje';vapor=1-smoothStep((t-8)/1.2);}
 else {x=7+5*smoothStep((t-10)/2);wheelAngle=-(5+x-7)/WHEEL_RADIUS;phase=t<12?'Salida':'Maniobra completada';}
 const q=new Quaternion();
 const u=t<3?t/3:t<5?(t-3)/2:t<8?(t-5)/3:t<10?(t-8)/2:(t-10)/2;
 const speed=t<3?10*u*(1-u):t<5||t<10&&t>=8?12*u*(1-u):t<8?28*u*(1-u):15*u*(1-u);
 return {position:[x,y,0],quaternion:q.toArray() as Pose['quaternion'],wheelAngle,vapor,phase,speed};
}};
export const CARRIER_PLATFORM_HEIGHT=3.55;
export const CARRIER_ESCAPE_START_X=-9.5;
const CARRIER_DURATION=13;
export const carrierEscape:Scenario={id:'fuga-del-portacoches',title:'La fuga del portacoches',duration:CARRIER_DURATION,evaluate(time){
 const t=clamp(time,0,CARRIER_DURATION),u=(start:number,end:number)=>smoothStep((t-start)/(end-start));
 let x=CARRIER_ESCAPE_START_X,y=CARRIER_PLATFORM_HEIGHT+WHEEL_RADIUS,z=0,roll=0,phase:string,vapor=0,wheelAngle=-5.2*t/WHEEL_RADIUS;
 if(t<3.2){phase='Llegada';}
 else if(t<5){
  const ignition=(t-3.2)/1.8;
  y+=.08*Math.sin(Math.PI*ignition)**2;
  phase='Arranque';vapor=smoothStep((t-3.2)/.8);
 }else if(t<6.2){
  y+=.5*u(5,6.2);phase='Despegue';vapor=1;wheelAngle=-5.2*5/WHEEL_RADIUS;
 }else if(t<8){
  const progress=u(6.2,8);
  x-=2.6*progress;y+=.5+2.8*progress;z=-.25*progress;roll=.12*progress;
  phase='Despegue';vapor=1;wheelAngle=-5.2*5/WHEEL_RADIUS;
 }else if(t<12){
  const progress=u(8,12);
  x=CARRIER_ESCAPE_START_X-2.6+22*progress;
  y+=3.3+6.5*progress;z=-.25-4.5*progress;roll=.12*(1-progress);
  phase='Fuga';vapor=1-.45*progress;wheelAngle=-5.2*5/WHEEL_RADIUS;
 }else{
  const progress=u(12,13);
  x=CARRIER_ESCAPE_START_X-2.6+22+2.2*progress;
  y+=9.8+2.4*progress;z=-4.75-.4*progress;phase=t<13?'Fuga':'Maniobra completada';
  vapor=.55*(1-progress);wheelAngle=-5.2*5/WHEEL_RADIUS;
 }
 const q=new Quaternion().setFromEuler(new Euler(0,0,roll));
 const speed=t<=5?5.2:0;
 return {position:[x,y,z],quaternion:q.toArray() as Pose['quaternion'],wheelAngle,vapor:clamp(vapor),phase,speed};
}};
export const CABLE_SUPPORT_HEIGHT=7.6;
export const CABLE_SUPPORT_RADIUS=.055;
export const CABLE_SUPPORT_CENTERLINE_HEIGHT=CABLE_SUPPORT_HEIGHT-CABLE_SUPPORT_RADIUS;
export const CABLE_SUPPORT_X=[-HALF_WHEELBASE,0,HALF_WHEELBASE] as const;
export const CABLE_SUPPORT_WHEEL_Z=[-.94,.94] as const;
export const CABLE_SUPPORT_SPAN_HALF_LENGTH=10.5;
export const CABLE_SUPPORT_FLAT_HALF_LENGTH=2;
export const CABLE_SUPPORT_ENDPOINT_HEIGHT=11.4;
export function cableSupportHeightAt(z:number){
 const rise=smooth((Math.abs(z)-CABLE_SUPPORT_FLAT_HALF_LENGTH)/(CABLE_SUPPORT_SPAN_HALF_LENGTH-CABLE_SUPPORT_FLAT_HALF_LENGTH));
 return CABLE_SUPPORT_CENTERLINE_HEIGHT+(CABLE_SUPPORT_ENDPOINT_HEIGHT-CABLE_SUPPORT_CENTERLINE_HEIGHT)*rise;
}
export const CABLE_CONTACT_HEIGHT=CABLE_SUPPORT_HEIGHT+WHEEL_RADIUS;
export const CABLES_EFFECT_PARTICLE_BUDGET={vapor:160,sparks:96,total:256} as const;
const CABLES_DURATION=12;
export const cablesTangle:Scenario={id:'cables',title:'Cables',duration:CABLES_DURATION,evaluate(time){
 const t=clamp(time,0,CABLES_DURATION),impactTime=3.5,settlingTime=Math.max(0,Math.min(t-impactTime,10-impactTime));
 const roll=t<impactTime?0:.055*(1-Math.exp(-.8*settlingTime))+.32*Math.sin(3.2*settlingTime)*Math.exp(-.62*settlingTime);
 const rise=smooth((t-.8)/(impactTime-.8));
 const y=t<impactTime?WHEEL_RADIUS+(CABLE_CONTACT_HEIGHT-WHEEL_RADIUS)*rise:CABLE_CONTACT_HEIGHT+HALF_WHEELBASE*Math.abs(Math.sin(roll));
 const vapor=t<.8?0:t<4.8?smooth((t-.8)/.35)*(1-smooth((t-3.4)/1.4)):0;
 const phase=t<.8?'Atasco':t<impactTime?'Despegue':t<5.2?'Enredado':t<10?'Balanceo':t<CABLES_DURATION?'Atrapado':'Maniobra completada';
 const q=new Quaternion().setFromEuler(new Euler(0,0,roll));
 const riseProgress=clamp((t-.8)/(impactTime-.8)),speed=t<.8||t>=impactTime?0:(CABLE_CONTACT_HEIGHT-WHEEL_RADIUS)/(impactTime-.8)*6*riseProgress*(1-riseProgress);
 return {position:[0,y,0],quaternion:q.toArray() as Pose['quaternion'],wheelAngle:0,vapor:clamp(vapor),phase,speed};
}};
export const SONG_SKIP_TRAFFIC=[
 ...[-22,-14,14,22].map(x=>({position:[x,0,0] as [number,number,number],length:4.2,width:1.8})),
 ...[-22,-15,-8,8,15,22].flatMap(x=>[-5.2,5.2].map(z=>({position:[x,0,z] as [number,number,number],length:4.2,width:1.8}))),
] as const;
export const SONG_SKIP_BUS={position:[0,0,-5.2] as [number,number,number],length:9.2,width:2.45} as const;
export const SONG_SKIP_DURATION=11;
export type SongNotePose={position:[number,number,number];color:'first'|'next';opacity:number};
const SONG_NOTE_ANCHORS=[[-1.6,2.4,-.8],[-.7,2.9,.45],[.2,2.5,-.35],[1,3,.8],[1.7,2.65,-.65],[.65,3.35,-1.05]] as const;
export function songNotesAt(time:number):SongNotePose[]{
 const t=clamp(time,0,SONG_SKIP_DURATION),launch=smooth((t-4)/1.4),returning=smooth((t-10.15)/.45);
 const blink=Math.exp(-(((t-3.5)/.12)**2));
 return SONG_NOTE_ANCHORS.map(([x,y,z],index)=>{
  const firstOpacity=t<3?1:t<4?1-.82*blink:t<6?1-smooth((t-4)/2):0;
  const nextOpacity=t<10.15?0:returning;
  const scatter=(.75+index%3*.18)*launch,floatY=Math.min(t,3)*.17;
  const firstPosition:[number,number,number]=[
   x+Math.sign(x||1)*scatter*1.6,
   y+floatY+scatter*2.1,
   z+Math.sign(z||1)*scatter*1.2,
  ];
  const nextPosition:[number,number,number]=[x,y,z];
  const useNext=nextOpacity>firstOpacity;
  return {position:useNext?nextPosition:firstPosition,color:useNext?'next':'first',opacity:Math.max(firstOpacity,nextOpacity)};
 });
}
export const songSkip:Scenario={id:'saltar-cancion',title:'Saltar canción',duration:SONG_SKIP_DURATION,evaluate(time){
 const t=clamp(time,0,SONG_SKIP_DURATION),vibration=t>=3&&t<4?Math.sin((t-3)*Math.PI*24)*Math.sin((t-3)*Math.PI)*.035:0;
 const rise=smooth((t-4)/2.5),returning=smooth((t-9)/2);
 const y=t<4?WHEEL_RADIUS+.018*Math.sin((t-3)*Math.PI)**2:t<6.5?WHEEL_RADIUS+10.2*rise:t<9?WHEEL_RADIUS+10.2:WHEEL_RADIUS+10.2*(1-returning);
 const roll=t<6.5?0:t<8.5?3*Math.PI*smooth((t-6.5)/2):t<9?3*Math.PI+Math.PI*smooth((t-8.5)/.5):0;
 const q=new Quaternion().setFromEuler(new Euler(0,0,roll+vibration));
 const vapor=t<4?0:t<6.5?smooth((t-4)/.35):t<8.5?.22:t<9.5?.42*(1-smooth((t-8.5)/1)):0;
 const sample=(sampleTime:number)=>sampleTime<4?WHEEL_RADIUS:sampleTime<6.5?WHEEL_RADIUS+10.2*smooth((sampleTime-4)/2.5):sampleTime<9?WHEEL_RADIUS+10.2:WHEEL_RADIUS+10.2*(1-smooth((sampleTime-9)/2));
 const speed=Math.abs(sample(Math.min(SONG_SKIP_DURATION,t+.01))-sample(Math.max(0,t-.01)))/.02;
 const phase=t<3?'Atasco':t<4?'Siguiente':t<6.5?'Despegue':t<8.5?'Voltereta':t<SONG_SKIP_DURATION?'Vuelta al hueco':'Maniobra completada';
 return {position:[0,y,0],quaternion:q.toArray() as Pose['quaternion'],wheelAngle:0,vapor:clamp(vapor),phase,speed};
}};
/** Parking-lot layout shared by the scenario, the environment and the tests. Bays run along Z, the aisle along X. */
export const PARKING = {
 groundY: 0,
 slotX: 0,
 slotZ: -2.8,
 bayWidth: 3,
 bayDepth: 5.6,
 aisleZ: 3.6,
 aisleWidth: 7.2,
 parkedBayX: [-9, -6, -3, 3, 6, 9],
 oppositeRowX: [-12, 12],
} as const;
/** Footprints (length along the heading, width) used for collision tests and procedural car boxes. */
export const ROADSTER_FOOTPRINT = { length: 5.1, width: 2.1 } as const;
export const GREY_CAR_FOOTPRINT = { length: 4.2, width: 1.8 } as const;
export type GreyCarState = { position: [number, number, number]; yaw: number; indicator: boolean; brake: boolean; reverse: boolean; headlightFlash: boolean };
const SPACE_DURATION = 10;
const GREY_TURN = 35 * Math.PI / 180;
const GREY_START_X = -18;
const GREY_APPROACH_SPEED = 5;
const GREY_BRAKE_START = 2.4;
const GREY_BRAKE_TIME = .7;
const GREY_BRAKE_DISTANCE = GREY_APPROACH_SPEED * GREY_BRAKE_TIME / 2;
const GREY_APPROACH_END_X = GREY_START_X + GREY_APPROACH_SPEED * GREY_BRAKE_START;
const GREY_STOP_X = GREY_APPROACH_END_X + GREY_BRAKE_DISTANCE;
const GREY_STOP_Z = PARKING.aisleZ - 1;
const GREY_REVERSE_X = -5.1;
const ROADSTER_DROP_START = 1.4;
const ROADSTER_LAND = 5.4;
export const PARKING_DEFAULT_DROP_HEIGHT = 12;
/** The grey car, a pure function of absolute time: it arrives, brakes hard, flashes its lights, reverses out and carries on. */
export function greyCarPose(time:number):GreyCarState{
 const t=clamp(time,0,SPACE_DURATION);
 let x:number,z:number=PARKING.aisleZ,yaw=0;
 if(t<GREY_BRAKE_START)x=GREY_START_X+GREY_APPROACH_SPEED*t;
 else if(t<GREY_BRAKE_START+GREY_BRAKE_TIME){const u=(t-GREY_BRAKE_START)/GREY_BRAKE_TIME;x=GREY_APPROACH_END_X+GREY_BRAKE_DISTANCE*(1-(1-u)*(1-u));}
 else x=GREY_STOP_X;
 if(t<7.2){const turn=smooth((t-1.6)/1.5);yaw=GREY_TURN*turn;z=PARKING.aisleZ-(PARKING.aisleZ-GREY_STOP_Z)*turn;}
 else if(t<8.4){const w=smooth((t-7.2)/1.2);x=GREY_STOP_X+(GREY_REVERSE_X-GREY_STOP_X)*w;z=GREY_STOP_Z+(PARKING.aisleZ-GREY_STOP_Z)*w;yaw=GREY_TURN*(1-w);}
 else{const u=(t-8.4)/1.6;x=GREY_REVERSE_X+5.5*u*u;}
 const flash=(t>=5.7&&t<6.1)||(t>=6.4&&t<6.8);
 return {position:[x,0,z],yaw,indicator:t>=1&&t<3.3&&Math.floor(t*3)%2===0,brake:t>=GREY_BRAKE_START&&t<7.2,reverse:t>=7.2&&t<8.4,headlightFlash:flash};
}
/** Builds the parking scenario; `dropHeight` is the distance above the asphalt where the Roadster starts, chosen so that it begins above the top edge of the frame. */
export function createParkingSpaceTheft(dropHeight:number):Scenario{
 return {id:'robo-de-plaza',title:'Robo de plaza',duration:SPACE_DURATION,evaluate(time){
  const t=clamp(time,0,SPACE_DURATION);
  const u=clamp((t-ROADSTER_DROP_START)/(ROADSTER_LAND-ROADSTER_DROP_START));
  const drop=(1-u)*(1-u);
  const vapor=t<ROADSTER_DROP_START?0:t<ROADSTER_LAND?smooth((t-ROADSTER_DROP_START)/1):1-smooth((t-ROADSTER_LAND)/1.6);
  const phase=t<ROADSTER_DROP_START?'Buscando sitio':t<ROADSTER_LAND?'Descenso':t<7.2?'Plaza ocupada':t<SPACE_DURATION?'Sigue buscando':'Maniobra completada';
  const q=new Quaternion().setFromEuler(new Euler(0,Math.PI/2,0));
  return {position:[PARKING.slotX,PARKING.groundY+WHEEL_RADIUS+dropHeight*drop,PARKING.slotZ],quaternion:q.toArray() as Pose['quaternion'],wheelAngle:0,vapor:clamp(vapor),phase,speed:0};
 }};
}
export const parkingSpaceTheft=createParkingSpaceTheft(PARKING_DEFAULT_DROP_HEIGHT);
export function advance(time:number,delta:number,playing:boolean,duration=DURATION){const next=playing?Math.min(duration,time+Math.max(0,delta)):time;return {time:next,playing:playing&&next<duration};}
