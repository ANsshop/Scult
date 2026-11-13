"""Rend la gamme : les pots CRI de chaque goût côte à côte, sur fond bleu, soleil dur.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/render_gamme.py -- sortie.png docs/3d/pot-cri-cassis-framboise.glb docs/3d/pot-cri.glb docs/3d/pot-cri-ice-tea-peche.glb

Les modèles sont posés de gauche à droite, dans l'ordre donné, légèrement
tournés vers le centre pour que chaque pastille de goût reste lisible.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0])
MODELS = [os.path.abspath(a) for a in argv[1:]]
STEP = 0.128  # entraxe : les pots se frôlent

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
n = len(MODELS)
for k, path in enumerate(MODELS):
    bpy.ops.import_scene.gltf(filepath=path)
    root = next(o for o in bpy.context.selected_objects if o.parent is None)
    offset = k - (n - 1) / 2
    root.rotation_mode = "XYZ"
    # tournés pour montrer la pastille (elle est à droite de la face) ; les pots de côté regardent vers le centre
    root.rotation_euler = (0, 0, math.radians(-16 - 9 * offset))
    root.location = (offset * STEP, 0.012 * abs(offset), 0)


def net(scene, samples):
    """Réglages communs de rendu : image nette (filtre de pixel serré, étiquettes
    en interpolation cubique, débruitage qui respecte la texture) et contrastée."""
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(os.environ.get("SAMPLES", samples))
    scene.cycles.filter_width = 1.0
    scene.cycles.use_denoising = True
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
        scene.cycles.denoising_prefilter = "ACCURATE"
        scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    except Exception:
        pass
    for mat in bpy.data.materials:
        if mat.node_tree:
            for node in mat.node_tree.nodes:
                if node.type == "TEX_IMAGE":
                    node.interpolation = "Cubic"
    scene.view_settings.view_transform = "Standard"
    try:
        scene.view_settings.look = os.environ.get("LOOK", "Medium High Contrast")
    except Exception as err:
        print("LOOK_KO", err)
    scene.view_settings.exposure = float(os.environ.get("EXPO", 0))


def flat(name, color, rough):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = next(x for x in mat.node_tree.nodes if x.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    return mat


# Fond bleu Klein en courbe : pas de ligne d'horizon
prof = [(-1.2, 0.0), (0.3, 0.0)] + [(0.3 + 0.25 * math.sin(a), 0.25 - 0.25 * math.cos(a)) for a in [math.pi / 2 * k / 12 for k in range(1, 13)]] + [(0.55, 1.5)]
verts, faces = [], []
for (y, z) in prof:
    verts += [(-2.0, y, z), (2.0, y, z)]
for k in range(len(prof) - 1):
    faces.append((2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2))
mesh = bpy.data.meshes.new("FOND")
mesh.from_pydata(verts, [], faces)
for poly in mesh.polygons:
    poly.use_smooth = True
mesh.materials.append(flat("KLEIN", (0.006, 0.04, 0.57), 0.85))
scene.collection.objects.link(bpy.data.objects.new("FOND", mesh))

world = bpy.data.worlds.new("MONDE")
scene.world = world
world.use_nodes = True
bg = next(x for x in world.node_tree.nodes if x.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.55, 0.6, 0.75, 1.0)
bg.inputs["Strength"].default_value = float(os.environ.get("MONDE", 0.12))

aim = bpy.data.objects.new("CIBLE", None)
aim.location = (0, 0, 0.066)
scene.collection.objects.link(aim)


def lamp(name, kind, energy, location, **kw):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    for key, val in kw.items():
        setattr(data, key, val)
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"


lamp("LGT_soleil", "SUN", float(os.environ.get("SOLEIL", 1.5)), (0.7, -1.2, 1.2), angle=math.radians(1.2))
lamp("LGT_debouche", "AREA", float(os.environ.get("DEBOUCHE", 3.2)), (-0.9, -0.8, 0.4), size=0.9)

cam_data = bpy.data.cameras.new("CAM")
cam_data.lens = 85
cam = bpy.data.objects.new("CAM", cam_data)
cam.location = (0.0, -0.98, 0.10)
scene.collection.objects.link(cam)
con = cam.constraints.new("TRACK_TO")
con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
scene.camera = cam

net(scene, 192)
scene.render.resolution_x, scene.render.resolution_y = int(os.environ.get("W", 2400)), int(os.environ.get("H", 1350))
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("GAMME_OK", OUT)
