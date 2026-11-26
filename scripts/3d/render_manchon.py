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
printed.inputs["Roughness"].default_value = 0.12
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
film_mix = nt.nodes.new("ShaderNodeMixShader")      # 0 : transparent, 1 : reflet
nt.links.new(clear.outputs[0], film_mix.inputs[1])
nt.links.new(gloss.outputs[0], film_mix.inputs[2])
mix = nt.nodes.new("ShaderNodeMixShader")       # 0 : sans impression, 1 : imprimé
nt.links.new(tex.outputs["Alpha"], mix.inputs[0])
nt.links.new(film_mix.outputs[0], mix.inputs[1])
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
        film_mix.inputs[0].default_value = 0.16
    else:
        clear.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
        film_mix.inputs[0].default_value = 0.0


# --- Les matières du pot, reprises pour le rendu ----------------------------------
# Le modèle d'origine est mat partout : sous des boîtes à lumière, le noir renvoie
# un voile gris et le rose ne brille pas. Ici :
#  - le noir est vraiment noir : fond de l'étiquette ramené à zéro, presque aucun
#    reflet (satiné, pas mat) ;
#  - le rose est du chrome : partout où l'étiquette est rose (plus de rouge que de
#    vert — le bouffon, en noir et blanc, n'en a pas), la matière devient un métal poli.
# Le rose du chrome. Repères : le vrai pot, mesuré sur les photos du produit (lettres SCULT et bandeau), est un
# rose framboise, #CC1C6B en moyenne — plus rouge que le rose du site (#FF2E93), sans rien de violet. Et le rendu
# retenu par le porteur du projet le 2026-11-26 : le pot vu sous le film rose translucide, d'un rose-rouge franc.
# Un métal multiplie la lumière par sa couleur, et à l'écran le rouge sature le premier : avec du bleu dans la
# teinte, les reflets forts virent au violet. La teinte est donc presque sans bleu ; ce sont les reflets qui
# l'éclaircissent vers le rose vif.
CHROME_ROSE = (0.80, 0.0054, 0.073, 1.0)


def polish(name):
    mat = bpy.data.materials[name]
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tex = next(n for n in nt.nodes if n.type == "TEX_IMAGE")
    deep = nt.nodes.new("ShaderNodeBrightContrast")           # le noir de la photo (gris très sombre) tombe à zéro
    deep.inputs["Bright"].default_value = -0.012
    deep.inputs["Contrast"].default_value = 0.03
    nt.links.new(tex.outputs["Color"], deep.inputs["Color"])
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tex.outputs["Color"], sep.inputs["Color"])
    diff = nt.nodes.new("ShaderNodeMath")
    diff.operation = "SUBTRACT"
    nt.links.new(sep.outputs["Red"], diff.inputs[0])
    nt.links.new(sep.outputs["Green"], diff.inputs[1])
    pink = nt.nodes.new("ShaderNodeMapRange")                 # 0 : pas rose ; 1 : rose franc
    pink.inputs["From Min"].default_value, pink.inputs["From Max"].default_value = 0.05, 0.20
    nt.links.new(diff.outputs[0], pink.inputs["Value"])
    nt.links.new(pink.outputs["Result"], bsdf.inputs["Metallic"])
    # La teinte du chrome : le rose de la marque, un peu retenu en bleu. Un métal multiplie la lumière par sa couleur ;
    # avec le rose de la photo (riche en bleu), les reflets forts viraient au violet.
    tint = nt.nodes.new("ShaderNodeMix")
    tint.data_type = "RGBA"
    tint.inputs["B"].default_value = CHROME_ROSE
    fac = nt.nodes.new("ShaderNodeMath")
    fac.operation = "MULTIPLY"
    fac.inputs[1].default_value = 0.9
    nt.links.new(pink.outputs["Result"], fac.inputs[0])
    nt.links.new(fac.outputs[0], tint.inputs["Factor"])
    nt.links.new(deep.outputs["Color"], tint.inputs["A"])
    nt.links.new(tint.outputs["Result"], bsdf.inputs["Base Color"])
    rough = nt.nodes.new("ShaderNodeMapRange")                # noir satiné → chrome poli
    rough.inputs["To Min"].default_value, rough.inputs["To Max"].default_value = 0.42, float(os.environ.get("CHROME", 0.28))
    nt.links.new(pink.outputs["Result"], rough.inputs["Value"])
    nt.links.new(rough.outputs["Result"], bsdf.inputs["Roughness"])
    spec = nt.nodes.new("ShaderNodeMapRange")                 # presque pas de reflet sur le noir, plein reflet sur le chrome
    spec.inputs["To Min"].default_value, spec.inputs["To Max"].default_value = 0.10, 0.5
    nt.links.new(pink.outputs["Result"], spec.inputs["Value"])
    nt.links.new(spec.outputs["Result"], bsdf.inputs["Specular IOR Level"])


polish("POT_etiquette")
polish("POT_dessus")
noir = next(n for n in bpy.data.materials["POT_noir"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
noir.inputs["Base Color"].default_value = (0.0012, 0.0012, 0.0012, 1.0)
noir.inputs["Roughness"].default_value = 0.42
noir.inputs["Specular IOR Level"].default_value = 0.10
rose = next(n for n in bpy.data.materials["POT_rose"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
rose.inputs["Roughness"].default_value = float(os.environ.get("CHROME", 0.28))
rose.inputs["Base Color"].default_value = CHROME_ROSE

# --- Le studio ------------------------------------------------------------------
# Studio noir, comme le site : fond sombre avec un halo derrière le pot, sol
# brillant qui renvoie son reflet, pièce presque éteinte. Toute la lumière vient
# de boîtes à lumière, dont les reflets dessinent le film plastique. (Essayés et
# écartés le 2026-11-26 : fond gris-rose, terne ; fond rose, tout se délave ;
# fond blanc, le pot rose s'y perd.)
def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


decor = bpy.data.materials["DECOR_gris"]
bsdf = next(n for n in decor.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
bsdf.inputs["Base Color"].default_value = srgb(os.environ.get("FOND", "#0d0b0d"))
bsdf.inputs["Roughness"].default_value = 0.32
bg = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
bg.inputs["Strength"].default_value = float(os.environ.get("MONDE", 0.03))
for o in [o for o in bpy.data.objects if o.name.startswith("LGT_")]:
    bpy.data.objects.remove(o, do_unlink=True)


def softbox(name, energy, location, target, w, h, color=(1.0, 1.0, 1.0)):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size, data.size_y = w, h
    data.energy = energy
    data.color = color
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    aim = bpy.data.objects.new(name + "_cible", None)
    aim.location = target
    scene.collection.objects.link(aim)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    return obj


K = float(os.environ.get("LUM", 1.5))
MID = (0.0, 0.0, 0.07)
softbox("LGT_cle", 6.0 * K, (-0.44, -0.50, 0.30), MID, 0.20, 1.00)                       # boîte haute et étroite, devant à gauche : un reflet net sur le tiers gauche, pas un voile sur toute la face
softbox("LGT_bande", 5.0 * K, (0.46, -0.30, 0.16), MID, 0.07, 0.90)                      # bande étroite à droite : le filet de lumière sur l'arête
softbox("LGT_face", 1.6 * K, (0.10, -0.90, 0.10), MID, 1.20, 0.80)                       # très grande et faible, de face : débouche l'étiquette sans la faire briller
softbox("LGT_dessus", 3.0 * K, (0.02, -0.10, 0.62), (0.0, 0.0, 0.14), 0.55, 0.55)         # au-dessus : le couvercle
softbox("LGT_contre", 5.0 * K, (-0.42, 0.40, 0.34), MID, 0.30, 0.60)                      # contre-jour : détache le pot du fond
softbox("LGT_contre_d", 4.0 * K, (0.44, 0.38, 0.30), MID, 0.25, 0.60)                       # le même à droite. Lumières toutes blanches : une lumière rose tirait le pot et le fond vers le violet
# Ce que le chrome rose renvoie. L'appareil regarde le pot d'un peu haut : un miroir vertical lui renvoie donc le
# sol devant le pot, qui est noir — sans rien d'autre, le chrome reste éteint. On couche devant le pot un panneau
# lumineux que seuls les reflets voient : ni l'appareil ni l'éclairage diffus. Le chrome s'allume, le noir reste noir.
ciel = softbox("LGT_ciel", float(os.environ.get("CIEL", 18.0)) * K, (0.0, -0.52, 0.004), (0.0, -0.52, 1.0), 1.1, 1.0)
ciel.visible_diffuse = False
ciel.visible_camera = False
softbox("LGT_halo", float(os.environ.get("HALO", 2.5)) * K, (0.0, 0.05, 0.75), (0.0, 0.50, 0.22), 0.70, 0.40)   # le halo sur le fond, derrière le pot

scene.cycles.samples = int(os.environ.get("SAMPLES", 160))
scene.cycles.transparent_max_bounces = 12
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
    print("RENDU_GPU", [d.name for d in prefs.devices if d.use])
except Exception as err:
    print("RENDU_CPU", err)
scene.render.resolution_x, scene.render.resolution_y = 1200, 1440
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 92
# Courbe « Standard » : les couleurs sortent franches et le noir reste noir. (Essayés : AgX, qui délave tout ;
# « Khronos PBR Neutral », sans dérive de teinte mais qui pâlit le chrome en rose bonbon.)
COURBES = {"neutre": [("Khronos PBR Neutral", "None")], "agx": [("AgX", "AgX - Punchy"), ("AgX", "Punchy")], "filmic": [("Filmic", "High Contrast")], "standard": [("Standard", "None")]}
for transform, look in COURBES[os.environ.get("COURBE", "standard")] + [("Standard", "None")]:
    try:
        scene.view_settings.view_transform = transform
        scene.view_settings.look = look
        print("RENDU_COURBE", transform, look)
        break
    except Exception:
        continue
scene.view_settings.exposure = float(os.environ.get("EXPO", 0.0))

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

# Le vernis du pot : une coque transparente et brillante sur le corps, une autre sur le couvercle. C'est elle qui
# donne les longs reflets nets des boîtes à lumière, comme sous le film translucide — sans rien changer au noir
# dessous. Elle ne reçoit pas le panneau du sol (voir plus bas), qui la voilerait de blanc.
def lathe_shell(name, prof, parent):
    vs, fs = [], []
    for (r, z) in prof:
        for j in range(SEG):
            t = -math.pi + 2 * math.pi * j / SEG
            vs.append((r * math.sin(t), -r * math.cos(t), z))
    for i in range(len(prof) - 1):
        for j in range(SEG):
            j2 = (j + 1) % SEG
            fs.append((i * SEG + j, i * SEG + j2, (i + 1) * SEG + j2, (i + 1) * SEG + j))
    m = bpy.data.meshes.new(name)
    m.from_pydata(vs, [], fs)
    m.update()
    for poly in m.polygons:
        poly.use_smooth = True
    o = bpy.data.objects.new(name, m)
    scene.collection.objects.link(o)
    o.parent = parent
    return o


vernis = bpy.data.materials.new("POT_vernis")
vernis.use_nodes = True
vt = vernis.node_tree
for n in list(vt.nodes):
    vt.nodes.remove(n)
v_out = vt.nodes.new("ShaderNodeOutputMaterial")
v_clear = vt.nodes.new("ShaderNodeBsdfTransparent")
v_gloss = vt.nodes.new("ShaderNodeBsdfGlossy")
v_gloss.inputs["Roughness"].default_value = 0.07
v_mix = vt.nodes.new("ShaderNodeMixShader")
v_mix.inputs[0].default_value = float(os.environ.get("VERNIS", 0.12))
vt.links.new(v_clear.outputs[0], v_mix.inputs[1])
vt.links.new(v_gloss.outputs[0], v_mix.inputs[2])
vt.links.new(v_mix.outputs[0], v_out.inputs["Surface"])
E = 0.00015
BODY_SHELL = arc(R - F_BOT, F_BOT, F_BOT + E, -90, 0) + arc(R - F_SHOULDER, Z_BODY - F_SHOULDER, F_SHOULDER + E, 0, 80)
LID_SHELL = [(R_LID + 0.0004, Z_LID + RING_H + 0.0004), (R_LID + 0.0004, H - F_TOP)] + arc(R_LID - F_TOP, H - F_TOP, F_TOP + 0.0004, 0, 90)[1:] + [(0.004, H + 0.0004)]
shells = []
for parent in (root, bare):
    for nm, prof in (("POT_vernis_corps", BODY_SHELL), ("POT_vernis_couvercle", LID_SHELL)):
        sh = lathe_shell(nm, prof, parent)
        sh.data.materials.append(vernis)
        shells.append(sh)
for sh in shells[2:]:
    sh.hide_render = True      # ceux du pot nu : montrés avec lui

# Le panneau du sol n'éclaire que le pot : sur le film plastique, il poserait un voile blanc.
try:
    pots = bpy.data.collections.new("POTS")
    for o in [c for c in root.children if c.name != "MANCHON"] + list(bare.children):
        if not o.name.startswith("POT_vernis"):
            pots.objects.link(o)
    ciel.light_linking.receiver_collection = pots
    print("RENDU_LIAISON ok")
except Exception as err:
    print("RENDU_LIAISON impossible", err)


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
    if os.environ.get("ESSAI"):
        scene.render.resolution_percentage = 50
        name = os.environ["ESSAI"] + "-" + name
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


# --- Le film : le manchon se déchire ------------------------------------------------
# `-- film` rend l'animation image par image (PNG) puis la monte en MP4 ;
# `-- film-essai` n'en rend que six images, en petit, pour régler.
#
# Le film d'animation a son propre manchon : fendu sur le devant (deux pans, soudés
# nulle part), au profil découpé tous les 3 mm pour pouvoir s'ouvrir de haut en bas.
# À chaque image, un script replace ses points :
#   1. la déchirure descend du couvercle au pied (le film se fend : texture « fente ») ;
#   2. derrière elle, chaque pan s'écarte et glisse vers le dos du pot, en se gondolant ;
#   3. une fois ouverts, les pans tombent derrière le pot, hors de vue.
# Pendant ce temps le pot tourne un peu, l'appareil s'approche, et une bande de
# lumière balaie la face : d'abord le film brillant, puis le chrome rose.
FPS = 24
N_FRAMES = 144
T_TEAR, D_TEAR, D_OPEN = 30, 22, 20      # la déchirure part à l'image 30, met 22 images à descendre ; un pan met 20 images à s'ouvrir
T_FALL, D_FALL = 72, 12
FILM_OUT = os.path.join(ROOT, "docs/3d/manchon/film")


def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def build_film():
    """Le manchon fendu : pour chaque pan (gauche, droite), une nappe de points (rang du profil × colonne)."""
    pts = [profile[0]]
    for a, b in zip(profile[:-1], profile[1:]):
        n = max(1, int(math.ceil(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.003)))
        pts += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    lens = [0.0]
    for a, b in zip(pts[:-1], pts[1:]):
        lens.append(lens[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    cols = SEG // 2
    base, fverts, ffaces, fuvs = [], [], [], []
    for side in (-1, 1):
        off = len(fverts)
        for i, (r, z) in enumerate(pts):
            for j in range(cols + 1):
                phi = side * math.pi * j / cols          # 0 : le devant (la fente) ; ±π : le dos
                base.append((r, z, phi, lens[i] / lens[-1], side))   # le pan est noté à part : sur la fente, φ vaut 0 des deux côtés
                fverts.append((r * math.sin(phi), -r * math.cos(phi), z))
        for i in range(len(pts) - 1):
            for j in range(cols):
                a, b, c, d = off + i * (cols + 1) + j, off + i * (cols + 1) + j + 1, off + (i + 1) * (cols + 1) + j + 1, off + (i + 1) * (cols + 1) + j
                ffaces.append((a, b, c, d) if side > 0 else (b, a, d, c))
                quad = (a, b, c, d) if side > 0 else (b, a, d, c)
                fuvs += [(0.5 + base[q][2] / (2 * math.pi), base[q][3]) for q in quad]
    m = bpy.data.meshes.new("MANCHON_FILM")
    m.from_pydata(fverts, [], ffaces)
    m.update()
    lay = m.uv_layers.new(name="UVMap")
    for k, uv in enumerate(fuvs):
        lay.data[k].uv = uv
    for poly in m.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("MANCHON_FILM", m)
    scene.collection.objects.link(obj)
    obj.parent = root
    return obj, base


def film_material():
    """Le film rose, plus la fente : au-dessus du front de déchirure, la texture « fente » ouvre le film."""
    fm = mat.copy()
    fm.name = "MANCHON_film_fendu"
    t = fm.node_tree
    tex_f = next(n for n in t.nodes if n.type == "TEX_IMAGE")
    tex_f.image = bpy.data.images.load(os.path.join(TEX, "manchon-rose.png"))
    mixn = next(n for n in t.nodes if n.type == "MIX_SHADER" and n.inputs[0].is_linked)
    clearn = next(n for n in t.nodes if n.type == "BSDF_TRANSPARENT")
    clearn.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    next(n for n in t.nodes if n.type == "MIX_SHADER" and not n.inputs[0].is_linked).inputs[0].default_value = 0.0
    slit = t.nodes.new("ShaderNodeTexImage")
    slit.image = bpy.data.images.load(os.path.join(TEX, "manchon-fente.png"))
    slit.image.colorspace_settings.name = "Non-Color"
    uv = t.nodes.new("ShaderNodeUVMap")
    sepuv = t.nodes.new("ShaderNodeSeparateXYZ")
    t.links.new(uv.outputs["UV"], sepuv.inputs[0])
    front = t.nodes.new("ShaderNodeValue")
    front.name = "FRONT"
    front.outputs[0].default_value = 2.0                    # hauteur (v) du front de déchirure : au-dessus, le film est fendu
    above = t.nodes.new("ShaderNodeMath")
    above.operation = "GREATER_THAN"
    t.links.new(sepuv.outputs["Y"], above.inputs[0])
    t.links.new(front.outputs[0], above.inputs[1])
    cut = t.nodes.new("ShaderNodeMath")
    cut.operation = "MULTIPLY"
    t.links.new(slit.outputs["Color"], cut.inputs[0])
    t.links.new(above.outputs[0], cut.inputs[1])
    keep = t.nodes.new("ShaderNodeMath")
    keep.operation = "SUBTRACT"
    keep.inputs[0].default_value = 1.0
    t.links.new(cut.outputs[0], keep.inputs[1])
    alpha = t.nodes.new("ShaderNodeMath")
    alpha.operation = "MULTIPLY"
    t.links.new(tex_f.outputs["Alpha"], alpha.inputs[0])
    t.links.new(keep.outputs[0], alpha.inputs[1])
    t.links.new(alpha.outputs[0], mixn.inputs[0])
    return fm, front


def film_pose(obj, base, front, f):
    """Place le film, le pot, l'appareil et les lumières à l'image f."""
    co = []
    q = smooth((f - T_FALL) / D_FALL)                       # la chute des pans, à la fin
    for (r, z, phi, v, side) in base:
        e = smooth((f - (T_TEAR + (1 - v) * D_TEAR)) / D_OPEN)
        a = abs(phi)
        a2 = a + (0.965 * math.pi - a) * e                  # le pan glisse vers le dos
        lead = (1 - a / math.pi) ** 2                       # le bord de la déchirure se soulève le plus
        r2 = r + e * (0.003 + 0.012 * lead) + 0.016 * math.sin(math.pi * e) * lead
        r2 += e * 0.0030 * math.sin(13 * a2 + 7 * v + side)  # les gondoles du film froissé
        z2 = z * (1 - 0.94 * q) - 0.002 * q
        r2 *= 1 + 0.10 * q
        co += [r2 * math.sin(side * a2), -r2 * math.cos(side * a2), z2]
    obj.data.vertices.foreach_set("co", co)
    obj.data.update()
    obj.hide_render = f >= T_FALL + D_FALL + 2
    front.outputs[0].default_value = 1.0 - (f - T_TEAR) / D_TEAR if f >= T_TEAR else 2.0

    k = f / (N_FRAMES - 1)
    root.rotation_euler = (0, 0, math.radians(14 - 26 * smooth(k)))     # le pot tourne doucement, de +14° à −12°
    cam.data.lens = 150 + 26 * smooth(k)                                 # l'appareil s'approche
    # La bande de lumière : un premier passage sur le film rose, un second sur le chrome, après la chute.
    sweep = bpy.data.objects["LGT_balai"]
    p1 = (f - 2) / 26
    p2 = (f - (T_FALL + 12)) / 46
    p = p1 if 0 <= p1 <= 1 else p2 if 0 <= p2 <= 1 else None
    # Le premier passage est bien plus doux : le film rose renvoie toute la lumière qu'il reçoit et blanchirait.
    force = 4.0 if 0 <= p1 <= 1 else 16.0
    sweep.data.energy = 0.0 if p is None else force * K * math.sin(math.pi * p)
    sweep.location = (-0.55 + 1.10 * (p or 0.0), -0.62, 0.18)
    # Une fois le pot nu : la boîte de face baisse, les contre-jours montent — le noir se creuse, le chrome ressort.
    reveal = smooth((f - T_FALL) / 24)
    bpy.data.objects["LGT_face"].data.energy = 1.6 * K * (1 - 0.6 * reveal)
    bpy.data.objects["LGT_cle"].data.energy = 6.0 * K * (1 - 0.25 * reveal)
    bpy.data.objects["LGT_contre_d"].data.energy = 4.0 * K * (1 + 0.8 * reveal)
    bpy.data.objects["LGT_contre"].data.energy = 5.0 * K * (1 + 0.6 * reveal)


def film(frames, percent, samples, montage):
    softbox("LGT_balai", 0.0, (-0.55, -0.62, 0.18), MID, 0.05, 0.95)
    obj, base = build_film()
    fm, front = film_material()
    obj.data.materials.append(fm)
    sleeve.hide_render = True
    root.location = (0, 0, 0)
    for o in [bare] + list(bare.children):
        o.hide_render = True
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1080, 1350
    scene.render.resolution_percentage = percent
    scene.cycles.samples = samples
    scene.render.use_persistent_data = True
    scene.render.image_settings.file_format = "PNG"
    os.makedirs(FILM_OUT, exist_ok=True)
    for f in frames:
        path = os.path.join(FILM_OUT, "image-%04d.png" % f)
        if montage and os.path.exists(path):
            continue                                         # reprise après interruption
        film_pose(obj, base, front, f)
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print("RENDU_FILM", f, flush=True)
    if not montage:
        return
    # Le montage : les images, dans l'ordre, en MP4 (H.264).
    edit = bpy.data.scenes.new("MONTAGE")
    edit.sequence_editor_create()
    se = edit.sequence_editor
    strips = se.strips if hasattr(se, "strips") else se.sequences
    strip = strips.new_image("film", os.path.join(FILM_OUT, "image-0000.png"), 1, 1)
    for f in range(1, N_FRAMES):
        strip.elements.append("image-%04d.png" % f)
    edit.frame_start, edit.frame_end = 1, N_FRAMES
    edit.render.fps = FPS
    edit.render.resolution_x, edit.render.resolution_y = 1080, 1350
    edit.render.resolution_percentage = 100
    try:
        edit.render.image_settings.media_type = "VIDEO"
    except Exception:
        pass
    edit.render.image_settings.file_format = "FFMPEG"
    edit.render.ffmpeg.format = "MPEG4"
    edit.render.ffmpeg.codec = "H264"
    edit.render.ffmpeg.constant_rate_factor = "HIGH"
    edit.render.ffmpeg.audio_codec = "NONE"
    edit.view_settings.view_transform = "Standard"
    edit.render.filepath = os.path.join(ROOT, "docs/3d/manchon/manchon-dechirure.mp4")
    bpy.ops.render.render(animation=True, scene="MONTAGE")
    print("FILM_OK", edit.render.filepath)


if VIEWS == "film":
    film(range(N_FRAMES), 100, int(os.environ.get("SAMPLES", 56)), True)
elif VIEWS == "film-essai":
    film([int(x) for x in os.environ.get("IMAGES", "0,36,46,58,82,120").split(",")], 50, 24, False)
elif VIEWS != "rien":
    for key in (SHOTS if VIEWS == "all" else VIEWS.split(",")):
        render(*SHOTS[key])
print("MANCHON_OK")
