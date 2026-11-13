"""Rend un « mur de pots » : le pot CRI répété en grille serrée, cadré en diagonale.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/render_pattern.py -- docs/3d/pot-cri.glb sortie.png [largeur] [hauteur] [noir|klein]

Part du modèle exporté (docs/3d/pot-cri.glb) : les textes sont ceux de
l'étiquette, identiques sur chaque pot. Les copies partagent le même maillage.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
GLB = os.path.abspath(argv[0] if len(argv) > 0 else "docs/3d/pot-cri.glb")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/3d/renders/mur-de-pots.png")
W = int(argv[2]) if len(argv) > 2 else 2400
H_PX = int(argv[3]) if len(argv) > 3 else 1350
FOND = argv[4] if len(argv) > 4 else "noir"   # couleur des interstices entre les pots

POT_H = 0.138          # hauteur du pot (voir build_pot.py)
STEP_X = 0.1170        # pas entre deux colonnes : les pots se touchent presque
STEP_Z = 0.1425        # pas entre deux rangées : un pot posé sur l'autre
COLS, ROWS = 6, 5      # demi-étendue de la grille, de part et d'autre du centre
ROLL = math.radians(24)  # inclinaison du cadre
VIEW_W = 0.50          # largeur de scène visible, en mètres (≈ 4 pots)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=GLB)
imported = list(bpy.context.selected_objects)
roots = [o for o in imported if o.parent is None]
for mat in bpy.data.materials:  # même grain de papier que dans les rendus de contrôle
    bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat.node_tree else None
    if bsdf:
        bsdf.inputs["Roughness"].default_value = max(bsdf.inputs["Roughness"].default_value, 0.55)


def clone(dx, dz):
    """Copie liée du pot entier, décalée dans le plan du mur."""
    twin = {}
    for o in imported:
        c = o.copy()            # même maillage, mêmes matériaux
        scene.collection.objects.link(c)
        twin[o] = c
    for o, c in twin.items():
        if o.parent in twin:
            c.parent = twin[o.parent]
            c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
    for r in roots:
        twin[r].location = (r.location.x + dx, r.location.y, r.location.z + dz)


for i in range(-COLS, COLS + 1):
    for j in range(-ROWS, ROWS + 1):
        if i == 0 and j == 0:
            continue
        # une colonne sur deux est décalée d'un demi-pot, comme des pots rangés en quinconce
        clone(i * STEP_X, j * STEP_Z + (STEP_Z / 2 if i % 2 else 0.0))

# Le fond, juste derrière les pots : il n'apparaît que dans les interstices
mesh = bpy.data.meshes.new("FOND")
mesh.from_pydata([(-3, 0.062, -3), (3, 0.062, -3), (3, 0.062, 3), (-3, 0.062, 3)], [], [(0, 1, 2, 3)])
fond = bpy.data.objects.new("FOND", mesh)
scene.collection.objects.link(fond)
klein = bpy.data.materials.new("FOND")
klein.use_nodes = True
b = next(n for n in klein.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
b.inputs["Roughness"].default_value = 0.9
if FOND == "klein":
    b.inputs["Base Color"].default_value = (0.006, 0.04, 0.57, 1.0)
    # un peu de lumière propre : les interstices restent bleus au lieu de tomber au noir
    b.inputs["Emission Color"].default_value = (0.006, 0.04, 0.57, 1.0)
    b.inputs["Emission Strength"].default_value = 0.55
else:
    b.inputs["Base Color"].default_value = (0.003, 0.003, 0.004, 1.0)
mesh.materials.append(klein)

world = bpy.data.worlds.new("MONDE")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.5, 0.56, 0.78, 1.0)
bg.inputs["Strength"].default_value = 0.28

origin = bpy.data.objects.new("CIBLE", None)
origin.location = (0, 0, POT_H / 2)
scene.collection.objects.link(origin)


def sun(name, energy, location, angle_deg):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = energy
    data.angle = math.radians(angle_deg)
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = origin, "TRACK_NEGATIVE_Z", "UP_Y"


sun("LGT_soleil", 2.3, (1.6, -2.0, 1.5), 1.5)    # dur, de face en haut à droite : des ombres nettes entre les pots
sun("LGT_debouche", 0.45, (-2.0, -2.2, -0.4), 20)

cam_data = bpy.data.cameras.new("CAM")
cam_data.type = "ORTHO"
cam_data.ortho_scale = VIEW_W
cam = bpy.data.objects.new("CAM", cam_data)
cam.location = (0.0, -3.0, POT_H / 2)
cam.rotation_euler = (math.pi / 2, ROLL, 0.0)
scene.collection.objects.link(cam)
scene.camera = cam

scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = W, H_PX
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "Standard"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("MUR_OK", OUT)
