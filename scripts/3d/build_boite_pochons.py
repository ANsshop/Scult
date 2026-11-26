"""Construit le modèle 3D de la boîte de pochons de caféine SCULT dans Blender, sans interface.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/build_boite_pochons.py -- docs/3d/pochons/textures docs/3d/pochons [glb]

Produit boite-pochons.blend (source modifiable, textures liées) dans le dossier
de sortie, et le modèle .glb (textures comprises).

La boîte est un solide de révolution : une cuvette blanche, un couvercle blanc
à peine plus large, un joint entre les deux, et la bande rose autour de la
cuvette. Quatre matières : BOITE_couvercle (le dessus, textures/couvercle.jpg),
BOITE_bande (textures/bande.jpg, deux fois le texte autour), BOITE_dessous
(textures/dessous.jpg) et BOITE_blanc.

Elle est modélisée à plat (axe vertical) puis dressée sur la tranche, le
couvercle vers -Y : à 0° d'orbite, une visionneuse montre le couvercle de face,
et la faire tourner retourne la boîte comme une pièce, jusqu'au sourire du
dessous.

Dimensions en mètres : une boîte ronde de 70 mm sur 24, les proportions de la
feuille de référence (docs/refonte-bouffon/sources/planche-pochons.jpg) — à
recaler sur la vraie boîte quand elle existera.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
TEX = os.path.abspath(argv[0] if len(argv) > 0 else "docs/3d/pochons/textures")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/3d/pochons")
GLB = argv[2] if len(argv) > 2 else os.path.join(OUT, "boite-pochons.glb")
NAME = "boite-pochons"

# --- Dimensions -----------------------------------------------------------
R = 0.0350          # rayon de la cuvette
H = 0.0240          # épaisseur totale
Z_SEAM = 0.0158     # haut de la cuvette
GROOVE = 0.0005     # joint entre la cuvette et le couvercle
LIP = 0.0007        # le couvercle dépasse de la cuvette
F_BOT = 0.0026      # arrondi du fond
F_TOP = 0.0028      # arrondi du bord du couvercle
BAND = (0.0034, 0.0146)   # la bande rose : du bas au haut, sur la cuvette
SEG = 128
STEPS = 8

Z_LID = Z_SEAM + GROOVE
R_LID = R + LIP
WHITE = (0.92, 0.92, 0.92)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene


def new_object(name, verts, faces, uvs, mats, face_mats=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name="UVMap")
    k = 0
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            layer.data[li].uv = uvs[k]
            k += 1
        poly.use_smooth = True
        if face_mats:
            poly.material_index = face_mats[poly.index]
    for m in mats:
        mesh.materials.append(m)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def material(name, image=None, color=(0.8, 0.8, 0.8), rough=0.6):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    mat.diffuse_color = (*color, 1.0)
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX, image))
        tex.location = (-420, 240)
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def ring(r, z, t):
    """Point du cercle de rayon r à la hauteur z ; t = 0 : vers -Y."""
    return (r * math.sin(t), -r * math.cos(t), z)


def arc(cr, cz, f, a0, a1):
    return [(cr + f * math.cos(math.radians(a0 + (a1 - a0) * k / STEPS)),
             cz + f * math.sin(math.radians(a0 + (a1 - a0) * k / STEPS))) for k in range(STEPS + 1)]


def uv_top(x, y, z, u):       # le couvercle, vu de dessus
    return (0.5 + x / (2 * R_LID), 0.5 + y / (2 * R_LID))


def uv_bottom(x, y, z, u):    # le dessous, vu de dessous : on le regarde retourné, d'où le miroir en x
    return (0.5 - x / (2 * R), 0.5 + y / (2 * R))


def uv_band(x, y, z, u):
    return (u, (z - BAND[0]) / (BAND[1] - BAND[0]))


def uv_none(x, y, z, u):
    return (0.5, 0.5)


def lathe(name, chains, mats):
    """Solide de révolution (même principe que scripts/3d/build_pot_bouffon.py)."""
    verts, faces, uvs, fmats = [], [], [], []
    for chain in chains:
        rows = {}

        def row(p):
            key = (round(p[0], 7), round(p[1], 7))
            if key not in rows:
                rows[key] = len(verts)
                if p[0] == 0:
                    verts.append((0.0, 0.0, p[1]))
                else:
                    for j in range(SEG):
                        verts.append(ring(p[0], p[1], -math.pi + 2 * math.pi * j / SEG))
            return rows[key]

        for pts, mi, uvf in chain:
            for a, b in zip(pts[:-1], pts[1:]):
                ia, ib = row(a), row(b)
                for j in range(SEG):
                    j2 = (j + 1) % SEG
                    u0, u1 = j / SEG, (j + 1) / SEG
                    if a[0] == 0:
                        quad, us = (ia, ib + j2, ib + j), (0.5, u1, u0)
                    elif b[0] == 0:
                        quad, us = (ia + j, ia + j2, ib), (u0, u1, 0.5)
                    else:
                        quad, us = (ia + j, ia + j2, ib + j2, ib + j), (u0, u1, u1, u0)
                    faces.append(quad)
                    uvs += [uvf(*verts[q], u) for q, u in zip(quad, us)]
                    fmats.append(mi)
    return new_object(name, verts, faces, uvs, mats, fmats)


lid_top = material("BOITE_couvercle", "couvercle.jpg", rough=0.55)
band = material("BOITE_bande", "bande.jpg", rough=0.35)
under = material("BOITE_dessous", "dessous.jpg", rough=0.55)
white = material("BOITE_blanc", color=WHITE, rough=0.5)

# --- La cuvette : dessous (texturé), arrondi, paroi, bord ---------------------
base = lathe("BOITE_cuvette", [[
    ([(0.0, 0.0), (R - F_BOT, 0.0)], 0, uv_bottom),
    (arc(R - F_BOT, F_BOT, F_BOT, -90, 0) + [(R, Z_SEAM)], 1, uv_none),
    ([(R, Z_SEAM), (R - 0.0012, Z_SEAM), (R - 0.0012, Z_LID + 0.0015)], 1, uv_none),
]], [under, white])

# --- Le couvercle : dessous, flanc, bord arrondi, dessus (texturé) ------------
lid = lathe("BOITE_couvercle", [
    [([(R - 0.0012, Z_LID), (R_LID, Z_LID)], 1, uv_none)],
    [
        ([(R_LID, Z_LID), (R_LID, H - F_TOP)], 1, uv_none),
        (arc(R_LID - F_TOP, H - F_TOP, F_TOP, 0, 90) + [(0.0, H)], 0, uv_top),
    ],
], [lid_top, white])

# --- La bande rose : un film à peine en relief autour de la cuvette -----------
R_BAND = R + 0.00018
band_obj = lathe("BOITE_bande", [[
    ([(R_BAND, BAND[0]), (R_BAND, BAND[1])], 0, uv_band),
]], [band])

# Toute la boîte sous un seul parent, dressée sur la tranche : le couvercle regarde vers -Y, la boîte est centrée
root = bpy.data.objects.new("BOITE_POCHONS", None)
scene.collection.objects.link(root)
parts = [base, lid, band_obj]
for o in parts:
    o.parent = root
root.rotation_euler = (math.radians(90), 0, 0)
root.location = (0, H / 2, 0)

os.makedirs(OUT, exist_ok=True)
if GLB != "none":
    os.makedirs(os.path.dirname(os.path.abspath(GLB)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts + [root]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = base
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(GLB), export_format="GLB", use_selection=True,
        export_apply=True, export_image_format="AUTO", export_yup=True,
    )

blend = os.path.join(OUT, NAME + ".blend")
bpy.ops.wm.save_as_mainfile(filepath=blend)
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_mainfile()
print("BOITE_OK", GLB)
