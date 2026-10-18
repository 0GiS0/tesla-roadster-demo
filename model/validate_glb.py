"""Validate exported wheel/contact contracts and self-contained glTF, using Python stdlib."""
import json, math, pathlib, struct
path=pathlib.Path(__file__).resolve().parents[1]/'public/models/roadster.glb'
data=path.read_bytes();magic,version,size=struct.unpack_from('<III',data)
assert magic==0x46546C67 and version==2 and size==len(data)
length,kind=struct.unpack_from('<II',data,12);assert kind==0x4E4F534A
doc=json.loads(data[20:20+length]);offset=20+length
bin_length,bin_kind=struct.unpack_from('<II',data,offset);assert bin_kind==0x004E4942
binary=data[offset+8:offset+8+bin_length]
assert not doc.get('cameras') and not doc.get('images') and not doc.get('textures')
assert not doc.get('extensions',{}).get('KHR_lights_punctual')
assert all('uri' not in b for b in doc['buffers'])
assert len(data)<2_000_000
nodes={node.get('name'):node for node in doc['nodes']}
expected={'Wheel_FL':(1.47,0,.94),'Wheel_FR':(1.47,0,-.94),'Wheel_RL':(-1.47,0,.94),'Wheel_RR':(-1.47,0,-.94)}
assert len([n for n in nodes if n and n.startswith('Wheel_')])==4
assert len([n for n in nodes if n and n.startswith('Static_Brake_Caliper_')])==4

def rotate(v,q):
 x,y,z,w=q;vx,vy,vz=v
 tx=2*(y*vz-z*vy);ty=2*(z*vx-x*vz);tz=2*(x*vy-y*vx)
 return (vx+w*tx+y*tz-z*ty,vy+w*ty+z*tx-x*tz,vz+w*tz+x*ty-y*tx)
for name,center in expected.items():
 node=nodes[name];actual=node['translation'];assert max(abs(a-b) for a,b in zip(actual,center))<1e-5,(name,actual)
 radii=[]
 for primitive in doc['meshes'][node['mesh']]['primitives']:
  accessor=doc['accessors'][primitive['attributes']['POSITION']];view=doc['bufferViews'][accessor['bufferView']]
  assert accessor['componentType']==5126 and accessor['type']=='VEC3'
  start=view.get('byteOffset',0)+accessor.get('byteOffset',0);stride=view.get('byteStride',12)
  for i in range(accessor['count']):
   v=struct.unpack_from('<fff',binary,start+i*stride);x,y,z=rotate(v,node.get('rotation',(0,0,0,1)));radii.append(math.hypot(x,y))
 assert abs(max(radii)-.44)<1e-5,(name,max(radii))
triangles=sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
assert triangles<30_000,triangles
print(json.dumps({'bytes':len(data),'triangles':triangles,'meshes':len(doc['meshes']),'wheelContracts':'pass','externalAssets':False,'exportedCamerasOrLights':False},indent=2))
