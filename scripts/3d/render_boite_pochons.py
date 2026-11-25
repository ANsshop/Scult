"""Rend la boîte de pochons sous plusieurs angles, sur fond transparent, pour les visuels du site.

Usage (depuis la racine du repo, après build-pochons.sh) :
  /Applications/Blender.app/Contents/MacOS/Blender --background docs/3d/pochons/boite-pochons.blend \
      --python scripts/3d/render_boite_pochons.py -- <dossier de sortie> [taille]

Ce sont des images de synthèse du modèle 3D (scripts/3d/build_boite_pochons.py),
pas des photos ni des images générées : la boîte y est exactement celle du site.
Le rose est rendu en métal grâce aux cartes de public/models/ (celles de la
visionneuse). Chaque vue : (nom, rotation de la boîte en degrés, élévation de
l'appareil). Rotation (90, roulis, lacet) : dressée sur la tranche, couvercle
vers l'appareil ; (0, 0, lacet) : posée à plat, couvercle vers le haut.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "docs/3d/pochons/rendus")
SIZE = int(argv[1]) if len(argv) > 1 else 1200
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VIEWS = [
    ("face", (90, -8, -20), 6),       # le couvercle de face, à peine tourné : la vue principale
    ("tranche", (90, 10, 58), 4),     # tournée : on lit la bande rose
    ("dos", (90, 6, 200), 8),         # retournée : le sourire chromé
    ("a-plat", (0, 0, -14), 36),      # posée à plat, vue de trois quarts : le couvercle se lit, la bande aussi
]

scene = bpy.context.scene
root = bpy.data.objects["BOITE_POCHONS"]

# Le rose en métal : vert = rugosité, bleu = métal (mêmes cartes que la visionneuse)
MAPS = {"BOITE_couvercle": "boite-pochons-metal-couvercle.jpg", "BOITE_bande": "boite-pochons-metal-bande.jpg", "BOITE_dessous": "boite-pochons-metal-dessous.jpg"}
for name, file in MAPS.items():
    mat = bpy.data.materials.get(name)
    if not mat:
        continue
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(ROOT_DIR, "public", "models", file))
    tex.image.colorspace_settings.name = "Non-Color"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tex.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])


def aim(obj, target=(0.0, 0.0, 0.0)):
    cible = bpy.data.objects.new(obj.name + "_cible", None)
    cible.location = target
    scene.collection.objects.link(cible)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = cible, "TRACK_NEGATIVE_Z", "UP_Y"


def light(name, energy, location, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.size = energy, size
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    aim(obj)


# Boîte à lumière en haut à gauche, débouchage à droite, deux liserés derrière (la boîte est blanche : ils la détachent du noir)
light("LGT_cle", 3.2, (-0.30, -0.45, 0.35), 0.55)
light("LGT_debouche", 0.8, (0.45, -0.40, 0.05), 0.8)
light("LGT_contre_g", 6, (-0.40, 0.35, 0.20), 0.35)
light("LGT_contre_d", 5, (0.40, 0.40, 0.25), 0.35)

world = bpy.data.worlds.new("MONDE")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
# Un ciel clair : c'est lui que le rose métallisé réfléchit (dans le noir, la bande s'éteindrait)
bg.inputs["Color"].default_value = (0.8, 0.8, 0.82, 1.0)
bg.inputs["Strength"].default_value = 0.75

cam_data = bpy.data.cameras.new("CAM")
cam_data.lens = 110
cam = bpy.data.objects.new("CAM", cam_data)
scene.collection.objects.link(cam)
aim(cam)
scene.camera = cam

scene.render.engine = "CYCLES"
scene.cycles.samples = int(os.environ.get("SAMPLES", 72))
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
# AgX : les blancs de la boîte gardent leur modelé au lieu de brûler
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    scene.view_settings.view_transform = "Filmic"
scene.view_settings.exposure = float(os.environ.get("EXPO", 0.15))
for mat in bpy.data.materials:
    if mat.node_tree:
        for node in mat.node_tree.nodes:
            if node.type == "TEX_IMAGE":
                node.interpolation = "Cubic"

os.makedirs(OUT, exist_ok=True)
DIST = 0.30
for name, rot, elev in VIEWS:
    root.rotation_euler = tuple(math.radians(a) for a in rot)
    root.location = (0, 0, 0)
    e = math.radians(elev)
    cam.location = (0.0, -DIST * math.cos(e), DIST * math.sin(e))
    scene.render.filepath = os.path.join(OUT, f"boite-pochons-{name}.png")
    bpy.ops.render.render(write_still=True)
print("RENDUS_OK", OUT)
