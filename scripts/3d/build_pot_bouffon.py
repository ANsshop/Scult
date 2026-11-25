"""Construit le modèle 3D du pot SCULT pré-workout (le « bouffon ») dans Blender, sans interface.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/build_pot_bouffon.py -- docs/3d/bouffon/textures docs/3d/bouffon [vues] [glb]

  vues : "all" (défaut) rend les cinq vues de contrôle, "none" n'en rend aucune.
  glb  : où écrire le modèle web (défaut <sortie>/pot-scult.glb), "none" pour ne pas l'écrire.

Produit dans le dossier de sortie : pot-scult.blend (source modifiable, textures
liées), renders/pot-scult-*.jpg, et le modèle .glb (textures comprises).

Le pot est un solide de révolution : corps noir mat, gorge, couvercle un peu
plus large au dessus plat, anneau rose métallisé au pied du couvercle, tirets
roses sur le flanc du couvercle. L'étiquette (textures/wrap.jpg, matière
POT_etiquette) habille tout le corps : u = 0,5 est le centre de la face, la
couture est au dos, v = 0 en bas du pot et v = 1 sous le couvercle. La face
regarde vers -Y, comme le pot CRI (scripts/3d/build_pot.py) : à 0° d'orbite, une
visionneuse montre la face.

Dimensions en mètres, relevées sur .bouffon-src/pot-packshot.png (rayon 597 px,
corps 1589 px de haut, appareil 13° au-dessus ; le couvercle fait 21 mm, entre
le packshot et les autres vues) — à recaler sur le vrai pot quand il existera. Les textures viennent de scripts/3d/pot-bouffon-textures.mjs,
qui reprend RADIUS et LABEL_H : les changer aux deux endroits.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
TEX = os.path.abspath(argv[0] if len(argv) > 0 else "docs/3d/bouffon/textures")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/3d/bouffon")
VIEWS = argv[2] if len(argv) > 2 else "all"
GLB = argv[3] if len(argv) > 3 else os.path.join(OUT, "pot-scult.glb")
NAME = "pot-scult"

# --- Dimensions -----------------------------------------------------------
R = 0.0432         # rayon du corps
H = 0.1400         # hauteur totale
Z_BODY = 0.1178    # haut du corps = haut de l'étiquette (LABEL_H des textures)
GROOVE = 0.0012    # gorge entre le corps et le couvercle
RING_H = 0.0026    # anneau rose, au pied du couvercle
LIP = 0.0008       # le couvercle dépasse du corps
NECK = 0.0030      # retrait du col, au fond de la gorge
F_BOT = 0.0040     # arrondi du fond
F_SHOULDER = 0.0014  # arrondi de l'épaule, sous la gorge
F_TOP = 0.0035     # arrondi du bord du couvercle
SEG = 128          # facettes autour
STEPS = 8          # facettes par arrondi

Z_LID = Z_BODY + GROOVE      # dessous du couvercle
R_LID = R + LIP
R_NECK = R - NECK
LID_H = H - Z_LID

# Tirets roses du flanc du couvercle : (centre en degrés depuis la face, vers la
# droite ; longueur en degrés ; hauteur en part du flanc). Les quatre premiers
# sont relevés sur le packshot, les autres font le tour comme sur la vue de dos.
DASH_H = 0.0007
LID_DASHES = [
    (-58.0, 30.0, 0.47), (-4.0, 20.5, 0.55), (12.0, 18.5, 0.44), (57.0, 24.5, 0.55),
    (104.0, 20.0, 0.50), (150.0, 16.0, 0.40), (186.0, 34.0, 0.52), (236.0, 18.0, 0.60), (268.0, 15.0, 0.43),
]

# Le noir du pot : sRGB 20/255, la valeur vers laquelle les textures fondent sur leurs bords
BLACK = (((20 / 255 + 0.055) / 1.055) ** 2.4,) * 3
PINK = (0.80, 0.020, 0.200)   # le film rose (#FF2E93 un peu retenu : le métal renvoie toute la lumière)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene


def new_object(name, verts, faces, uvs, mats, face_mats=None, smooth=True):
    """Maillage à partir de listes ; `uvs` donne un (u, v) par coin de face."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name="UVMap")
    k = 0
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            layer.data[li].uv = uvs[k]
            k += 1
        poly.use_smooth = smooth
        if face_mats:
            poly.material_index = face_mats[poly.index]
    for m in mats:
        mesh.materials.append(m)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def material(name, image=None, color=(0.8, 0.8, 0.8), rough=0.6, metallic=0.0):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    mat.diffuse_color = (*color, 1.0)
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX, image))
        tex.location = (-420, 240)
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def ring(r, z, t):
    """Point du cercle de rayon r à la hauteur z ; t = 0 : le centre de la face, vers -Y."""
    return (r * math.sin(t), -r * math.cos(t), z)


def arc(cr, cz, f, a0, a1):
    """Arrondi de rayon f autour de (cr, cz), de l'angle a0 à a1 (degrés)."""
    return [(cr + f * math.cos(math.radians(a0 + (a1 - a0) * k / STEPS)),
             cz + f * math.sin(math.radians(a0 + (a1 - a0) * k / STEPS))) for k in range(STEPS + 1)]


def uv_wrap(x, y, z, u):
    return (u, z / Z_BODY)


def uv_top(x, y, z, u):
    return (0.5 + x / (2 * R_LID), 0.5 + y / (2 * R_LID))


def uv_none(x, y, z, u):
    return (0.5, 0.5)


def lathe(name, chains, mats):
    """Solide de révolution. Chaque chaîne est une liste de tronçons
    ([(rayon, hauteur), …], indice de matière, fonction d'UV) parcourus dans le
    sens fond → flanc → dessus ; les tronçons d'une chaîne partagent leurs
    sommets (ombrage lisse), deux chaînes non (arête vive). Un rayon nul ferme
    la surface par un éventail."""
    verts, faces, uvs, fmats = [], [], [], []
    for chain in chains:
        rows = {}     # (r, z) arrondi → indice du premier sommet de l'anneau

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


label = material("POT_etiquette", "wrap.jpg", rough=0.72)
lid_top = material("POT_dessus", "lid-top.jpg", rough=0.74)
black = material("POT_noir", color=BLACK, rough=0.78)
pink = material("POT_rose", color=PINK, rough=0.30, metallic=1.0)

# --- Le corps : fond, arrondi, paroi, épaule, col ---------------------------
body = lathe("POT_corps", [[
    ([(0.0, 0.0), (R - F_BOT, 0.0)], 1, uv_none),
    (arc(R - F_BOT, F_BOT, F_BOT, -90, 0) + arc(R - F_SHOULDER, Z_BODY - F_SHOULDER, F_SHOULDER, 0, 90), 0, uv_wrap),
    ([(R - F_SHOULDER, Z_BODY), (R_NECK, Z_BODY), (R_NECK, Z_LID + 0.0020)], 1, uv_none),
]], [label, black])

# --- Le couvercle : dessous, flanc, bord arrondi, dessus ---------------------
lid = lathe("POT_couvercle", [
    [([(R_NECK, Z_LID), (R_LID, Z_LID)], 1, uv_none)],
    [
        ([(R_LID, Z_LID), (R_LID, H - F_TOP)], 1, uv_none),
        (arc(R_LID - F_TOP, H - F_TOP, F_TOP, 0, 90) + [(0.0, H)], 0, uv_top),
    ],
], [lid_top, black])

# --- L'anneau rose, au pied du couvercle : un film à peine en relief ---------
R_RING = R_LID + 0.00022
ring_obj = lathe("POT_anneau", [
    [([(R_LID - 0.0003, Z_LID - 0.00006), (R_RING, Z_LID - 0.00006)], 0, uv_none)],
    [([(R_RING, Z_LID - 0.00006), (R_RING, Z_LID + RING_H)], 0, uv_none)],
    [([(R_RING, Z_LID + RING_H), (R_LID - 0.0003, Z_LID + RING_H + 0.00015)], 0, uv_none)],
], [pink])

# --- Les tirets roses du flanc du couvercle ----------------------------------
dv, df, duv = [], [], []
r_dash = R_LID + 0.00014
for (centre, length, frac) in LID_DASHES:
    z = Z_LID + LID_H * frac
    n = max(2, int(math.ceil(length / 2.0)))
    base = len(dv)
    for k in range(n + 1):
        t = math.radians(centre - length / 2 + length * k / n)
        dv.append(ring(r_dash, z - DASH_H / 2, t))
        dv.append(ring(r_dash, z + DASH_H / 2, t))
    for k in range(n):
        a = base + 2 * k
        df.append((a, a + 2, a + 3, a + 1))
        duv += [(0.5, 0.5)] * 4
dashes = new_object("POT_tirets", dv, df, duv, [pink])

# Tout le pot sous un seul parent : c'est lui qu'on tourne
root = bpy.data.objects.new("POT_SCULT", None)
scene.collection.objects.link(root)
parts = [body, lid, ring_obj, dashes]
for o in parts:
    o.parent = root

# --- Export du modèle (avant le décor de rendu) -----------------------------
os.makedirs(OUT, exist_ok=True)
if GLB != "none":
    os.makedirs(os.path.dirname(os.path.abspath(GLB)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts + [root]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(GLB), export_format="GLB", use_selection=True,
        export_apply=True, export_image_format="AUTO", export_yup=True,
    )

# --- Décor de contrôle : fond gris de studio, comme sur les photos ----------
grey = material("DECOR_gris", color=(0.21, 0.21, 0.215), rough=0.9)
bv, bf_, buv = [], [], []
prof = [(-1.2, 0.0), (0.30, 0.0)] + [(0.30 + 0.25 * math.sin(a), 0.25 - 0.25 * math.cos(a)) for a in [math.pi / 2 * k / 12 for k in range(1, 13)]] + [(0.55, 1.4)]
for (y, z) in prof:
    bv += [(-1.6, y, z), (1.6, y, z)]
for k in range(len(prof) - 1):
    bf_.append((2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2))
    buv += [(0, 0), (1, 0), (1, 1), (0, 1)]
new_object("DECOR_fond", bv, bf_, buv, [grey])

world = bpy.data.worlds.new("DECOR_monde")
scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.6, 0.6, 0.62, 1.0)
bg.inputs["Strength"].default_value = float(os.environ.get("MONDE", 0.12))


def net(scene, samples):
    """Réglages de rendu, ceux du pot CRI : image nette (filtre de pixel serré,
    étiquettes en interpolation cubique, débruitage qui respecte la texture)."""
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
        scene.view_settings.look = os.environ.get("LOOK", "None")
    except Exception as err:
        print("LOOK_KO", err)
    scene.view_settings.exposure = float(os.environ.get("EXPO", 0))


def aim(obj, target):
    """Oriente un objet (appareil, lampe) vers un point."""
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
    aim(obj, (0.0, 0.0, H / 2))
    return obj


# Grande boîte à lumière en haut à gauche, débouchage à droite, liseré derrière
light("LGT_cle", float(os.environ.get("CLE", 11)), (-0.45, -0.55, 0.50), 0.7)
light("LGT_debouche", float(os.environ.get("DEBOUCHE", 3.5)), (0.60, -0.45, 0.20), 0.9)
light("LGT_contre", float(os.environ.get("CONTRE", 6)), (0.35, 0.55, 0.40), 0.5)


def camera(name, location, target, lens):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    aim(obj, target)
    return obj


# Même point de vue que le packshot : 13° au-dessus, longue focale
ELEV = math.radians(13.2)
DIST = 0.90
cam_main = camera("CAM_face", (0.0, -DIST * math.cos(ELEV), 0.071 + DIST * math.sin(ELEV)), (0.0, 0.0, 0.071), 170)
cam_top = camera("CAM_dessus", (0.0, -0.0001, 0.90), (0.0, 0.0, H), 230)

net(scene, 96)
scene.render.resolution_x, scene.render.resolution_y = 1000, 1200
try:
    scene.render.image_settings.media_type = "IMAGE"
except Exception:
    pass
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 88

# La source : enregistrée, puis réenregistrée avec les textures en chemins relatifs
blend = os.path.join(OUT, NAME + ".blend")
bpy.ops.wm.save_as_mainfile(filepath=blend)
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_mainfile()


def render(name, cam, angle_deg):
    root.rotation_euler = (0, 0, math.radians(angle_deg))
    scene.camera = cam
    scene.render.filepath = os.path.join(OUT, "renders", name)
    bpy.ops.render.render(write_still=True)


if VIEWS == "all":
    render(NAME + "-face.jpg", cam_main, 0)
    render(NAME + "-quart-gauche.jpg", cam_main, 40)    # le pot tourné : on voit son flanc gauche (le cœur N°001)
    render(NAME + "-quart-droit.jpg", cam_main, -40)
    render(NAME + "-dos.jpg", cam_main, 180)
    render(NAME + "-dessus.jpg", cam_top, 0)

print("POT_OK", GLB)
