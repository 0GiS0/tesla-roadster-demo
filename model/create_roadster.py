"""Original procedural 2026-inspired Roadster. +X forward, Z up; GLB exports +Y up.
Run: blender --background --python model/create_roadster.py
Only the authored model collection is exported; studio cameras/lights stay in the .blend.
"""
import bpy, math, os, argparse, sys
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
model=bpy.data.collections.new('Roadster_Model');bpy.context.scene.collection.children.link(model)
def own(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 model.objects.link(o);return o
def mat(name,color,metal=0,rough=.3,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
silver=mat('Brushed liquid titanium',(.62,.67,.73),.82,.24)
glass=mat('Smoked bronze panoramic glass',(.035,.029,.018),.08,.20)
black=mat('Satin carbon aero',(.015,.019,.025),.4,.29)
rubber=mat('Dark performance rubber',(.009,.011,.014),.05,.67)
rim=mat('Diamond cut forged alloy',(.32,.37,.44),.93,.22)
rotor=mat('Ventilated brake steel',(.12,.14,.17),.9,.38)
red=mat('Rear light ribbon',(.8,.007,.012),.2,.2,3)
white=mat('White LED blades',(.78,.87,1),.25,.2,4)
caliper=mat('Crimson brake calipers',(.42,.014,.018),.5,.3)
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);model.objects.link(o);o.data.materials.append(material);return o
def finish(o,width=.015):
 mod=o.modifiers.new('Small manufactured edge radii','BEVEL');mod.width=width;mod.segments=2
 o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');return o
def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=own(bpy.context.object);o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:finish(o,bevel)
 return o
def line(name,pts,radius,material):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=radius;curve.bevel_resolution=1
 s=curve.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(name,curve);model.objects.link(o);o.data.materials.append(material);return o
def cylinder(name,center,radius,depth,material,axis='Y',vertices=48):
 rotation=(math.pi/2,0,0) if axis=='Y' else (0,math.pi/2,0) if axis=='X' else (0,0,0)
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=center,rotation=rotation);o=own(bpy.context.object);o.name=name;o.data.materials.append(material);return o
def torus(name,center,radius,tube,material,axis='Y',segments=48):
 rotation=(math.pi/2,0,0) if axis=='Y' else (0,math.pi/2,0) if axis=='X' else (0,0,0)
 bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=10,major_radius=radius,minor_radius=tube,location=center,rotation=rotation);o=own(bpy.context.object);o.name=name;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 return o
# Eight-sided cross sections produce a low wedge, shoulder facets and narrowed underbody.
sections=[(-2.48,.92,-.13,.43),(-2.25,1.0,-.18,.52),(-1.47,1.055,-.2,.56),(-.65,.99,-.19,.56),(.55,.97,-.18,.49),(1.47,1.035,-.18,.535),(2.12,.96,-.14,.35),(2.49,.82,-.10,.22)]
verts=[]
for x,w,lo,hi in sections:
 verts += [(x,-w*.9,lo),(x,-w,lo+.1),(x,-w,hi-.085),(x,-w*.68,hi),(x,w*.68,hi),(x,w,hi-.085),(x,w,lo+.1),(x,w*.9,lo)]
faces=[tuple(reversed(range(8)))]
for i in range(len(sections)-1):
 for j in range(8):faces.append((i*8+j,i*8+(j+1)%8,(i+1)*8+(j+1)%8,(i+1)*8+j))
faces.append(tuple(range(len(verts)-8,len(verts))))
body=mesh('Body_Sculpted_Arch_Shell',verts,faces,silver)
# Actual round wheel-well cavities, rather than solid panels passing through the tires.
for x in [-1.47,1.47]:
 for side in [-1,1]:
  cut=cylinder('temporary arch cutter',(x,side*1.0,0),.485,.64,black,vertices=64)
  bpy.context.view_layer.objects.active=body
  mod=body.modifiers.new('Open wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
finish(body,.008)
# Continuous dark undertray stays between the wheel cavities.
cube('Flat aero undertray',(0,0,-.215),(3.55,1.3,.045),black,.012)
for side in [-1,1]:
 cube('Side carbon sill',(0,side*.969,-.12),(1.95,.07,.10),black,.018)
 # Door shutline and integrated shoulder intake.
 line('Door front shutline',[(.76,side*.986,.45),(.63,side*.991,.15),(.53,side*.972,-.1)],.0045,black)
 line('Door rear shutline',[(-.6,side*.996,.53),(-.68,side*1.001,.17),(-.77,side*.975,-.1)],.0045,black)
 mesh('Recessed side inlet',[(.78,side*1.0,.39),(1.05,side*1.023,.4),(.98,side*1.024,.34),(.77,side*1.0,.33)],[(0,1,2,3)],black)
 cube('Flush door handle',(-.42,side*1.004,.45),(.17,.012,.022),black,.006)
# Smooth, shallow panoramic canopy: 33 longitudinal stations and 25 cross sections.
# The glass falls continuously into a wide tapered rear window between the shoulders.
profile=[(-1.88,.47,.555),(-1.60,.54,.68),(-1.25,.62,.84),(-.85,.695,.975),(-.4,.715,1.025),(.03,.71,1.028),(.35,.715,.955),(.65,.73,.76),(1.08,.74,.468)]
def station(x):
 i=next((i for i in range(len(profile)-1) if profile[i][0]<=x<=profile[i+1][0]),len(profile)-2)
 p0=profile[max(0,i-1)];p1=profile[i];p2=profile[i+1];p3=profile[min(len(profile)-1,i+2)];t=(x-p1[0])/(p2[0]-p1[0])
 def cat(k):return .5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t)
 return cat(1),cat(2)
def canopy_point(x,u,offset=0):
 width,crown=station(x);base=.54-(x+1.88)/2.96*.075
 z=base+(crown-base)*.74*max(0,math.cos(u*math.pi/2))**.15
 return (x,u*width,z+offset)
v=[];f=[];nx=33;ny=25
for i in range(nx):
 x=-1.88+i/(nx-1)*2.96
 for j in range(ny):v.append(canopy_point(x,-1+j/(ny-1)*2))
for i in range(nx-1):
 for j in range(ny-1):a=i*ny+j;f.append((a,a+ny,a+ny+1,a+1))
canopy=mesh('Canopy_Curved_Panoramic_Glass',v,f,glass)
for p in canopy.data.polygons:p.use_smooth=True
for side in [-1,1]:
 line('Fine canopy metal border',[canopy_point(-1.88+i/32*2.96,side*.92,.008) for i in range(33)],.008,silver)
 line('Window beltline',[canopy_point(-1.88+i/32*2.96,side,.004) for i in range(33)],.006,silver)
 line('B pillar window division',[canopy_point(-.48,side*u,.007) for u in [.75,.8,.85,.9,.95,1]],.009,black)
 line('Rear glazing division',[canopy_point(-1.28,side*u,.006) for u in [.7,.78,.86,.93,1]],.004,black)
 line('Mirror stem',[(.70,side*.94,.43),(.6,side*1.02,.535)],.017,black)
 mirror=cube('Swept mirror',(.57,side*1.055,.56),(.20,.13,.065),silver,.025);mirror.rotation_euler[2]=-side*.2
# Sample the authored fender shoulder so lamp pockets sit flush, not above the body.
def shoulder(x,y,offset=0):
 for i in range(len(sections)-1):
  a,b=sections[i],sections[i+1]
  if a[0]<=x<=b[0]:
   t=(x-a[0])/(b[0]-a[0]);w=a[1]+(b[1]-a[1])*t;hi=a[3]+(b[3]-a[3])*t
   return (x,y,hi-.085*max(0,(abs(y)/w-.68)/.32)+offset)
 raise ValueError('Shoulder sample outside body')
# Crisp hood shutlines and triangular sunken headlamp pockets on the shoulder facets.
for side in [-1,1]:
 line('Hood panel seam',[(2.40,side*.58,.244),(1.65,side*.68,.516),(1.04,side*.72,.503)],.0035,black)
 pocket=[shoulder(2.30,side*.70,.003),shoulder(2.02,side*.91,.003),shoulder(1.78,side*.78,.003)]
 mesh('Triangular headlight recess',pocket,[(0,1,2)],black)
 # Thin light edges converge into the recessed triangle instead of rectangular light blocks.
 line('Headlight LED upper',[shoulder(2.26,side*.705,.008),shoulder(2.015,side*.891,.008)],.006,white)
 line('Headlight LED inside',[shoulder(2.26,side*.705,.008),shoulder(1.82,side*.781,.008)],.0045,white)
cube('Slim front dark band',(2.493,0,.045),(.022,1.62,.19),black,.012)
mesh('Low swept front splitter',[(2.57,-.86,-.14),(2.57,.86,-.14),(2.10,1.0,-.19),(2.10,-1.0,-.19)],[(0,1,2,3)],black)
# Full-width recessed rear ribbon and a sculpted aero diffuser with separated fins.
cube('Rear lamp dark recess',(-2.493,0,.345),(.03,1.82,.105),black,.015)
cube('Continuous rear light ribbon',(-2.513,0,.377),(.023,1.80,.033),red,.009)
cube('Rear diffuser bridge',(-2.43,0,-.085),(.19,1.75,.23),black,.015)
for y in [-.76,-.47,-.15,.15,.47,.76]:
 mesh('Rear diffuser vertical fin',[(-2.54,y,-.24),(-1.93,y,-.22),(-2.06,y,-.04),(-2.48,y,-.02)],[(0,1,2,3)],black)
# Four precision cold-gas nozzle rims and deeply recessed bores.
for i,y in enumerate([-.57,-.19,.19,.57]):
 torus('Thruster_Rear_'+str(i),(-2.54,y,.075),.068,.018,rim,'X',32)
 cylinder('Nozzle_Rear_'+str(i),(-2.526,y,.075),.052,.026,black,'X',32)
for x in [-1.1,1.1]:
 for y in [-.65,.65]:
  torus('Thruster_Under',(x,y,-.235),.085,.018,rim,'Z',24)
  cylinder('Nozzle_Under',(x,y,-.223),.064,.02,black,'Z',24)
# Wheel contracts: centers and tire outer radius stay identical to the contact evaluator.
for x,label in [(1.47,'F'),(-1.47,'R')]:
 for side,suffix in [(-1,'L'),(1,'R')]:
  center=Vector((x,side*.94,0));parts=[]
  parts.append(torus('Tire',center,.345,.095,rubber)) # radius exactly .44
  parts.append(cylinder('Inner wheel barrel',center,.327,.17,black))
  outward=side*1.047
  parts.append(torus('Diamond rim lip',(x,outward,0),.313,.012,rim,segments=48))
  parts.append(torus('Tire sidewall detail',(x,side*1.031,0),.371,.004,rubber))
  # Visible ventilated rotor and caliper behind the five angular split spokes.
  parts.append(cylinder('Brake disc',(x,side*1.022,0),.257,.018,rotor))
  for a in range(16):
   ang=a*math.tau/16
   parts.append(cylinder('Brake drill',(x+.222*math.sin(ang),side*1.034,.222*math.cos(ang)),.009,.003,black,vertices=8))
  cube('Static_Brake_Caliper_'+label+suffix,(x+.21,side*1.037,.02),(.08,.028,.23),caliper,.015)
  for a in range(5):
   angle=a*math.tau/5
   # Swept five-spoke silhouettes; each forks subtly toward the rim.
   for fork in [-1,1]:
    poly=[(.045,-.035),(.145,-.045),(.305,.018+fork*.018),(.305,.045+fork*.018),(.14,.02)]
    vv=[]
    for yy in [side*1.043,side*1.065]:
     for radial,tangent in poly:vv.append((x+radial*math.sin(angle)+tangent*math.cos(angle),yy,radial*math.cos(angle)-tangent*math.sin(angle)))
    ff=[(0,1,2,3,4),(9,8,7,6,5)]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]
    parts.append(mesh('Angular split spoke',vv,ff,rim))
  parts.append(cylinder('Wheel center cap',(x,side*1.072,0),.065,.017,black,vertices=24))
  for a in range(5):
   ang=a*math.tau/5;parts.append(cylinder('Lug',(x+.044*math.sin(ang),side*1.083,.044*math.cos(ang)),.008,.008,rim,vertices=8))
  bpy.ops.object.select_all(action='DESELECT')
  for p in parts:p.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name='Wheel_'+label+suffix;bpy.context.scene.cursor.location=center;bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
bpy.context.scene.cursor.location=(0,0,0)
os.makedirs(os.path.join(ROOT,'public/models'),exist_ok=True)
# Save a useful studio setup in the editable file, while keeping it out of export.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1200;scene.render.resolution_y=750;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18)
def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power,size in [((2,-4,6),1100,5),((-3,2,4),1400,4),((1,4,1),650,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,.3))
bpy.ops.object.camera_add(location=(6.4,-6.2,3.0));camera=bpy.context.object;aim(camera,(0,0,.35));camera.data.type='ORTHO';camera.data.ortho_scale=6.5;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'model/roadster.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in model.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/roadster.glb'),export_format='GLB',export_yup=True,use_selection=True,export_apply=True,export_cameras=False,export_lights=False)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--render-dir',help='Optional directory for front/rear studio PNG previews')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if args.render_dir:
 render_dir=os.path.abspath(args.render_dir);os.makedirs(render_dir,exist_ok=True)
 scene.render.filepath=os.path.join(render_dir,'roadster-refined-model.png');bpy.ops.render.render(write_still=True)
 camera.location=(-6,-5,3.2);aim(camera,(0,0,.35));scene.render.filepath=os.path.join(render_dir,'roadster-refined-rear.png');bpy.ops.render.render(write_still=True)
