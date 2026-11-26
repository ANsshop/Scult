"""Aperçus du manchon plastique scellé sur le pot SCULT (idée d'emballage, 2026-11-26).

Usage (depuis la racine du repo, après `node scripts/3d/manchon-textures.mjs`) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/render_manchon.py -- [vues]

  vues : "all" (défaut) ou des noms séparés par des virgules (rose,rose-cote,dechire,coeur,givre,duo).

Ouvre docs/3d/bouffon/pot-scult.blend (le pot, ses lumières, ses appareils),
pose dessus le film rétractable — une surface de révolution qui suit le pot
du fond jusqu'au dessus du couvercle, à 0,4 mm de lui, tendue par-dessus la
gorge — et rend chaque variante dans docs/3d/manchon/renders/.

Le film se déroule comme sa texture : u fait le tour (0,5 = le centre de la
face), v suit le profil du bas vers le haut, à la longueur. Les mesures du
profil sont celles de build_pot_bouffon.py ; les textures
(manchon-textures.mjs) reprennent les mêmes longueurs.

Là où la texture est transparente : rien (film déchiré, fenêtre), sauf pour le
film « givré », où c'est du plastique rose translucide.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
VIEWS = argv[0] if argv else "all"
ROOT = os.getcwd()
BLEND = os.path.join(ROOT, "docs/3d/bouffon/pot-scult.blend")
TEX = os.path.join(ROOT, "docs/3d/manchon/textures")
OUT = os.path.join(ROOT, "docs/3d/manchon/renders")

# --- Le pot (build_pot_bouffon.py) ------------------------------------------
R = 0.0432
H = 0.1400
Z_BODY = 0.1178
GROOVE = 0.0012
RING_H = 0.0026
LIP = 0.0008
F_BOT = 0.0040
F_SHOULDER = 0.0014
F_TOP = 0.0035
Z_LID = Z_BODY + GROOVE
R_LID = R + LIP

# --- Le film ------------------------------------------------------------------
GAP = 0.0004       # entre le pot et le film
TOP_IN = 0.0070    # ce que le film recouvre du dessus du couvercle
SEG = 192
STEPS = 10

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
root = bpy.data.objects["POT_SCULT"]


def arc(cr, cz, f, a0, a1):
    return [(cr + f * math.cos(math.radians(a0 + (a1 - a0) * k / STEPS)),
             cz + f * math.sin(math.radians(a0 + (a1 - a0) * k / STEPS))) for k in range(STEPS + 1)]


# Le profil (rayon, hauteur), du fond vers le dessus : arrondi du fond, paroi,
# pont par-dessus la gorge jusqu'à l'anneau, flanc du couvercle, bord, dessus.
profile = (
    arc(R - F_BOT, F_BOT, F_BOT + GAP, -90, 0)
    + [(R + GAP, Z_BODY - F_SHOULDER)]
    + [(R_LID + GAP + 0.0002, Z_LID + RING_H * 0.4), (R_LID + GAP + 0.0002, H - F_TOP)]
    + arc(R_LID - F_TOP, H - F_TOP, F_TOP + GAP + 0.0002, 0, 90)[1:]
    + [(R_LID - F_TOP - TOP_IN, H + GAP + 0.0002)]
)
lengths = [0.0]
for a, b in zip(profile[:-1], profile[1:]):
    lengths.append(lengths[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
TOTAL = lengths[-1]
print("MANCHON_LONGUEUR_MM", round(TOTAL * 1000, 1), "TOUR_MM", round(2 * math.pi * R * 1000, 1))

verts, faces, uvs = [], [], []
for (r, z) in profile:
    for j in range(SEG):
        t = -math.pi + 2 * math.pi * j / SEG
        verts.append((r * math.sin(t), -r * math.cos(t), z))
for i in range(len(profile) - 1):
    for j in range(SEG):
        j2 = (j + 1) % SEG
        faces.append((i * SEG + j, i * SEG + j2, (i + 1) * SEG + j2, (i + 1) * SEG + j))
        u0, u1 = j / SEG, (j + 1) / SEG
        v0, v1 = lengths[i] / TOTAL, lengths[i + 1] / TOTAL
        uvs += [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]

mesh = bpy.data.meshes.new("MANCHON")
mesh.from_pydata(verts, [], faces)
mesh.update()
layer = mesh.uv_layers.new(name="UVMap")
for k, uv in enumerate(uvs):
    layer.data[k].uv = uv
for poly in mesh.polygons:
    poly.use_smooth = True
sleeve = bpy.data.objects.new("MANCHON", mesh)
scene.collection.objects.link(sleeve)
sleeve.parent = root

# --- La matière du film : plastique brillant, imprimé ---------------------------
mat = bpy.data.materials.new("MANCHON_film")
mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new("ShaderNodeOutputMaterial")
tex = nt.nodes.new("ShaderNodeTexImage")
tex.interpolation = "Cubic"
printed = nt.nodes.new("ShaderNodeBsdfPrincipled")
printed.inputs["Roughness"].default_value = 0.16
try:
    printed.inputs["Coat Weight"].default_value = 1.0
    printed.inputs["Coat Roughness"].default_value = 0.05
except KeyError:
    pass
# Le film rétracté n'est jamais parfaitement tendu : un très léger relief trouble les reflets.
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 55.0
noise.inputs["Detail"].default_value = 2.0
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.035
bump.inputs["Distance"].default_value = 0.001
nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], printed.inputs["Normal"])
nt.links.new(tex.outputs["Color"], printed.inputs["Base Color"])
# Sans impression : rien du tout (déchirure, fenêtre) ou du plastique rose translucide (givré)
clear = nt.nodes.new("ShaderNodeBsdfTransparent")
gloss = nt.nodes.new("ShaderNodeBsdfGlossy")
gloss.inputs["Roughness"].default_value = 0.07
nt.links.new(bump.outputs["Normal"], gloss.inputs["Normal"])
film = nt.nodes.new("ShaderNodeMixShader")      # 0 : transparent, 1 : reflet
nt.links.new(clear.outputs[0], film.inputs[1])
nt.links.new(gloss.outputs[0], film.inputs[2])
mix = nt.nodes.new("ShaderNodeMixShader")       # 0 : sans impression, 1 : imprimé
nt.links.new(tex.outputs["Alpha"], mix.inputs[0])
nt.links.new(film.outputs[0], mix.inputs[1])
nt.links.new(printed.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], out.inputs["Surface"])
mesh.materials.append(mat)
images = {}


def film_setup(kind):
    """Charge le film `kind` ; `givre` : le plastique nu est rose et translucide, sinon il n'y en a pas."""
    if kind not in images:
        images[kind] = bpy.data.images.load(os.path.join(TEX, "manchon-%s.png" % kind))
    tex.image = images[kind]
    if kind == "givre":
        clear.inputs["Color"].default_value = (1.0, 0.36, 0.66, 1.0)
        film.inputs[0].default_value = 0.16
    else:
        clear.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
        film.inputs[0].default_value = 0.0


# --- Le décor : clair, pour que le rose et le noir se lisent tous les deux ------
decor = bpy.data.materials["DECOR_gris"]
bsdf = next(n for n in decor.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
bsdf.inputs["Base Color"].default_value = (0.80, 0.71, 0.75, 1.0)
bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Strength"].default_value = 0.30
bpy.data.objects["LGT_cle"].data.energy = 5.5
bpy.data.objects["LGT_debouche"].data.energy = 2.6
bpy.data.objects["LGT_contre"].data.energy = 4

scene.cycles.samples = int(os.environ.get("SAMPLES", 110))
scene.cycles.transparent_max_bounces = 12
scene.render.resolution_x, scene.render.resolution_y = 1200, 1440
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
scene.view_settings.view_transform = "Standard"

cam = bpy.data.objects["CAM_face"]

# Pour la vue à deux : le même pot une seconde fois, nu, à côté
bare = bpy.data.objects.new("POT_NU", None)
scene.collection.objects.link(bare)
for o in [c for c in root.children if c.name != "MANCHON"]:
    d = o.copy()
    scene.collection.objects.link(d)
    d.parent = bare
bare.hide_render = True
for c in bare.children:
    c.hide_render = True


def render(name, kind, angle, duo=False):
    film_setup(kind)
    root.rotation_euler = (0, 0, math.radians(angle))
    root.location = (-0.052, 0, 0) if duo else (0, 0, 0)
    bare.location = (0.052, 0.012, 0)
    bare.rotation_euler = (0, 0, math.radians(-8))
    for o in [bare] + list(bare.children):
        o.hide_render = not duo
    cam.data.lens = 112 if duo else 170
    scene.render.resolution_x = 1800 if duo else 1200
    scene.camera = cam
    scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("RENDU", name)


SHOTS = {
    "rose": ("manchon-1-rose-face.jpg", "rose", 0, False),
    "rose-cote": ("manchon-1-rose-cote.jpg", "rose", -42, False),   # le pot tourné : la bande d'ouverture vient de face
    "dechire": ("manchon-2-dechire.jpg", "dechire", 6, False),
    "coeur": ("manchon-3-coeur.jpg", "coeur", 0, False),
    "givre": ("manchon-4-givre.jpg", "givre", 0, False),
    "duo": ("manchon-avant-apres.jpg", "rose", 10, True),
}
os.makedirs(OUT, exist_ok=True)
for key in (SHOTS if VIEWS == "all" else VIEWS.split(",")):
    render(*SHOTS[key])
print("MANCHON_OK")
