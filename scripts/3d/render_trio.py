"""Rend « le trio » : trois pots CRI sur un sol brillant, avec leurs reflets, sur fond blanc ou noir.

Un pot debout au centre, un pot penché à gauche, un pot couché à droite ; fond
noir, lumière de studio. Part du modèle exporté (docs/3d/pot-cri.glb) : les
textes sont ceux de l'étiquette.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/render_trio.py -- docs/3d/pot-cri.glb sortie.png [largeur] [hauteur] [decalage] [zoom] [decalage_y] [blanc|noir]

  decalage   : déplace le groupe dans le cadre (0 = centré, 0.2 = vers la droite,
               pour laisser la place d'un texte à gauche).
  zoom       : 1 = le trio remplit la largeur d'un cadre 16:9 ; plus petit = plus de vide autour.
  decalage_y : descend le groupe dans le cadre (pour un texte au-dessus).

  Les trois pots sont serrés en grappe pour pouvoir être cadrés gros.
  Visuels du site : 2400 1350 0.21 1.0 0.02 blanc (ordinateur) et 1200 1500 0 1.25 0.17 blanc (téléphone).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
GLB = os.path.abspath(argv[0] if len(argv) > 0 else "docs/3d/pot-cri.glb")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/3d/renders/trio-noir.png")
W = int(argv[2]) if len(argv) > 2 else 2400
H_PX = int(argv[3]) if len(argv) > 3 else 1350
SHIFT = float(argv[4]) if len(argv) > 4 else 0.0
ZOOM = float(argv[5]) if len(argv) > 5 else 1.0
SHIFT_Y = float(argv[6]) if len(argv) > 6 else 0.06
FOND = argv[7] if len(argv) > 7 else "blanc"   # "blanc" (studio clair) ou "noir" (sol miroir)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB)
imported = list(bpy.context.selected_objects)
root = next(o for o in imported if o.parent is None)


def clone():
    twin = {}
    for o in imported:
        c = o.copy()  # même maillage, mêmes matériaux
        scene.collection.objects.link(c)
        twin[o] = c
    for o, c in twin.items():
        if o.parent in twin:
            c.parent = twin[o.parent]
            c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
    return twin[root], list(twin.values())


def place(r, parts, x, y, tilt_deg, yaw_deg):
    """Penche le pot (autour de Y), le tourne (autour de Z), puis le pose : son point le plus bas touche le sol."""
    r.rotation_mode = "XYZ"
    r.rotation_euler = (0.0, math.radians(tilt_deg), math.radians(yaw_deg))
    r.location = (x, y, 0.0)
    bpy.context.view_layer.update()
    low = min((o.matrix_world @ Vector(c)).z for o in parts if o.type == "MESH" for c in o.bound_box)
    r.location.z -= low


place(root, imported, 0.0, 0.0, 0, -6)            # debout, au centre
left, left_parts = clone()
place(left, left_parts, -0.02, 0.09, -58, 22)    # penché derrière, le couvercle vers le haut à gauche
right, right_parts = clone()
place(right, right_parts, 0.07, -0.07, 90, -50)   # couché devant, le couvercle vers l'objectif

world = bpy.data.worlds.new("MONDE")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
mat = bpy.data.materials.new("SOL")
mat.use_nodes = True
b = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

if FOND == "noir":
    # Le sol : un miroir sombre, dans le noir
    verts, faces = [(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [(0, 1, 2, 3)]
    b.inputs["Base Color"].default_value = (0.2, 0.2, 0.22, 1.0)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.07
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0.0
    POWER = 1.0
else:
    # Fond blanc : on rend les pots et leurs ombres sur fond transparent (le sol ne garde que
    # les ombres), et l'image est ensuite posée sur du blanc pur. Un sol blanc éclairé pour de
    # vrai aurait la même clarté que le papier des pots : ils s'y fondraient.
    verts, faces = [(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [(0, 1, 2, 3)]
    b.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1.0)
    b.inputs["Roughness"].default_value = 0.5
    bg.inputs["Color"].default_value = (1, 1, 1, 1)
    bg.inputs["Strength"].default_value = 0.4
    scene.render.film_transparent = True
    POWER = 1.0

floor_mesh = bpy.data.meshes.new("SOL")
floor_mesh.from_pydata(verts, [], faces)
for poly in floor_mesh.polygons:
    poly.use_smooth = True
floor = bpy.data.objects.new("SOL", floor_mesh)
scene.collection.objects.link(floor)
floor_mesh.materials.append(mat)
floor.is_shadow_catcher = FOND != "noir"

aim = bpy.data.objects.new("CIBLE", None)
aim.location = (0.02, 0.0, 0.07)
scene.collection.objects.link(aim)


def light(name, energy, location, size, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.size, data.color = energy * POWER, size, color
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    obj.visible_glossy = False  # éclaire les pots sans apparaître dans le miroir du sol
    scene.collection.objects.link(obj)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"


if FOND == "noir":
    light("LGT_face", 11, (0.35, -1.1, 0.75), 0.9)                       # la lumière principale, de face en haut à droite
    light("LGT_gauche", 4, (-1.0, -0.6, 0.4), 0.8, (0.85, 0.9, 1.0))    # débouche le pot de gauche
    light("LGT_contre_g", 16, (-0.8, 0.9, 0.55), 0.5, (0.75, 0.82, 1.0))  # liserés de contre-jour
    light("LGT_contre_d", 16, (0.9, 0.9, 0.55), 0.5)
else:
    # Sur blanc : une grande lumière douce presque à la verticale — des ombres courtes, sous les pots
    light("LGT_dessus", 30, (0.25, -0.45, 1.25), 1.1)
    light("LGT_face", 3, (0.0, -1.2, 0.35), 1.0)

cam_data = bpy.data.cameras.new("CAM")
cam_data.lens = 70 * ZOOM
cam_data.shift_x = -SHIFT       # décale le cadre : le groupe glisse vers la droite
cam_data.shift_y = SHIFT_Y  # descend le groupe : laisse voir les reflets, ou la place d'un texte au-dessus
cam = bpy.data.objects.new("CAM", cam_data)
cam.location = (0.0, -1.05, 0.16)
scene.collection.objects.link(cam)
con = cam.constraints.new("TRACK_TO")
con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
scene.camera = cam

scene.render.engine = "CYCLES"
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = W, H_PX
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("TRIO_OK", OUT)
