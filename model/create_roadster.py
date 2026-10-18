"""Original Roadster-inspired show car. Run with Blender --background --python this_file."""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.3,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
silver=mat('Satin titanium',(.65,.69,.73),.8,.25);glass=mat('Smoked bronze canopy',(.065,.055,.033),.65,.13);black=mat('Carbon graphite',(.018,.022,.029),.55,.3);rubber=mat('Performance rubber',(.012,.014,.018),.05,.65);rim=mat('Forged alloy',(.24,.27,.31),.95,.22);red=mat('Continuous rear light',(.9,.018,.01),.2,.2,5);white=mat('Blade headlamps',(.72,.85,1),.3,.2,4)
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o
def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Manufactured edges','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def hull(name,sections,material):
 verts=[]
 for x,w,lo,hi in sections:verts +=[(x,-w,lo),(x,w,lo),(x,w,hi),(x,-w,hi)]
 faces=[(0,3,2,1)]
 for i in range(len(sections)-1):
  a=i*4;b=a+4
  for j in range(4):faces.append((a+j,a+(j+1)%4,b+(j+1)%4,b+j))
 faces.append(tuple(range(len(verts)-4,len(verts))));return mesh(name,verts,faces,material)
hull('Body_Main',[(-2.4,.84,-.14,.48),(-1.65,1.02,-.2,.53),(-.6,1.0,-.17,.55),(.75,.94,-.16,.46),(2.15,.87,-.11,.28),(2.48,.7,-.05,.15)],silver)
hull('Canopy_Bronze',[(-1.45,.74,.5,.53),(-.65,.73,.53,1.0),(.35,.65,.45,.99),(1.12,.75,.4,.44)],glass)
# Thin body-colored roof and angular windshield divisions.
cube('Roof spine',(-.23,0,1.005),(1.04,.055,.025),silver)
for side in [-1,1]:
 cube('Side sill',(-.05,side*.98,-.1),(3.25,.095,.19),black,.025)
 cube('Headlight', (2.32,side*.49,.24),(.07,.49,.035),white,.012)
 cube('Mirror',(.5,side*1.05,.65),(.26,.14,.08),silver,.03)
 cube('Side air intake',(-1.0,side*1.015,.16),(.5,.025,.19),black,.03)
cube('Rear light ribbon',(-2.42,0,.43),(.045,1.67,.045),red,.012)
cube('Rear diffuser',(-2.36,0,-.14),(.22,1.76,.24),black,.02)
cube('Front splitter',(2.35,0,-.1),(.38,1.6,.055),black,.015)
for x,label in [(1.47,'F'),(-1.47,'R')]:
 for side,suffix in [(-1,'L'),(1,'R')]:
  center=Vector((x,side*.94,0));parts=[]
  bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=10,location=center,rotation=(math.pi/2,0,0),major_radius=.335,minor_radius=.105);o=bpy.context.object;o.data.materials.append(rubber);parts.append(o)
  bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.32,depth=.215,location=center,rotation=(math.pi/2,0,0));o=bpy.context.object;o.data.materials.append(black);parts.append(o)
  for a in range(10):
   angle=a*math.tau/10;loc=center+Vector((.19*math.sin(angle),side*.12,.19*math.cos(angle)))
   o=cube('spoke',loc,(.048,.045,.285),rim,.008);o.rotation_euler[1]=angle;parts.append(o)
  bpy.ops.object.select_all(action='DESELECT')
  for p in parts:p.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name='Wheel_'+label+suffix;bpy.context.scene.cursor.location=center;bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
# Recessed directional nozzles, physically separated from the body.
for i,y in enumerate([-.57,-.19,.19,.57]):
 bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=8,major_radius=.105,minor_radius=.025,location=(-2.49,y,.13),rotation=(0,math.pi/2,0));o=bpy.context.object;o.name='Thruster_Rear_'+str(i);o.data.materials.append(rim)
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.085,depth=.035,location=(-2.47,y,.13),rotation=(0,math.pi/2,0));o=bpy.context.object;o.name='Nozzle_Rear_'+str(i);o.data.materials.append(black)
for x in [-1.1,1.1]:
 for y in [-.65,.65]:
  bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=8,major_radius=.1,minor_radius=.025,location=(x,y,-.225));o=bpy.context.object;o.name='Thruster_Under';o.data.materials.append(rim)
bpy.context.scene.cursor.location=(0,0,0)
os.makedirs(os.path.join(ROOT,'public/models'),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'model/roadster.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/roadster.glb'),export_format='GLB',export_yup=True)
