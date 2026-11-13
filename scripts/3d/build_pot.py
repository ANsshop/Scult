"""Construit le modèle 3D du pot SCULT CRI dans Blender, sans interface.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/build_pot.py -- docs/3d/textures docs/3d [vues]

  Deux arguments de plus déclinent le pot par goût (étiquettes produites par
  scripts/3d/gouts.mjs) : le fichier d'étiquette et le nom des sorties, par
  exemple `… all wrap-ice-tea-peche.jpg pot-cri-ice-tea-peche`.

  vues : "all" (défaut) rend les cinq vues de contrôle, "none" n'en rend aucune,
         "turntable" rend aussi 48 images de rotation dans docs/3d/turntable/.

Produit dans le dossier de sortie : pot-cri.glb (modèle web), pot-cri.blend
(source modifiable) et renders/*.png.

Le pot est un solide de révolution : fond arrondi, corps, gorge du couvercle,
couvercle, bord arrondi. L'étiquette (textures/wrap.jpg) fait tout le tour ;
u = 0,5 est le centre de la face, la couture est au dos. Dimensions en mètres,
relevées sur les visuels — à recaler sur le vrai pot quand il existera.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
TEX = os.path.abspath(argv[0] if len(argv) > 0 else "docs/3d/textures")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/3d")
VIEWS = argv[2] if len(argv) > 2 else "all"
WRAP = argv[3] if len(argv) > 3 else "wrap.jpg"   # l'étiquette : wrap.jpg (fruits rouges) ou wrap-<goût>.jpg
NAME = argv[4] if len(argv) > 4 else "pot-cri"    # nom des fichiers produits
SHOT = "pot" if NAME == "pot-cri" else NAME      # préfixe des rendus de contrôle

# --- Dimensions -----------------------------------------------------------
R = 0.0540        # rayon du corps
H = 0.1380        # hauteur totale
LID = 0.0215      # hauteur du couvercle (la couture tombe à la naissance des cheveux)
LIP = 0.0007      # le couvercle dépasse à peine du corps
F_BOT = 0.0060    # arrondi du fond
F_TOP = 0.0050    # arrondi du bord du couvercle
SEG = 160         # facettes autour
STRAP_H = 0.0072  # hauteur du strap rouge, posé à cheval sur la couture
# Part de la texture réservée aux arrondis (papier vierge en haut et en bas)
V_BOT, V_TOP = 0.065, 0.935

bpy.ops.wm.read_factory_settings(use_empty=True)
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


def material(name, image=None, color=(0.8, 0.8, 0.8), rough=0.6, alpha=False, uv_scale=None):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX, image))
        tex.location = (-420, 240)
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if uv_scale:
            mapping = nt.nodes.new("ShaderNodeMapping")
            coord = nt.nodes.new("ShaderNodeTexCoord")
            mapping.inputs["Scale"].default_value = (*uv_scale, 1.0)
            nt.links.new(coord.outputs["UV"], mapping.inputs["Vector"])
            nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        if alpha:
            nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
            try:
                mat.surface_render_method = "DITHERED"
            except Exception:
                pass
    return mat


def ring(r, z, j):
    t = -math.pi + 2 * math.pi * j / SEG  # t = 0 : le centre de la face, vers -Y
    return (r * math.sin(t), -r * math.cos(t), z)


# --- Le corps : profil (rayon, hauteur, v) tourné autour de l'axe ----------
z_seam = H - LID
r_lid = R + LIP
profile = []
steps = 10
for k in range(steps + 1):  # arrondi du fond
    a = -math.pi / 2 + (math.pi / 2) * k / steps
    profile.append((R - F_BOT + F_BOT * math.cos(a), F_BOT + F_BOT * math.sin(a), V_BOT * k / steps))


def v_at(z):  # la partie droite de la paroi porte l'étiquette
    return V_BOT + (V_TOP - V_BOT) * (z - F_BOT) / ((H - F_TOP) - F_BOT)


for z in (z_seam * 0.5, z_seam - 0.0012):
    profile.append((R, z, v_at(z)))
profile.append((R, z_seam - 0.0005, v_at(z_seam - 0.0005)))            # gorge sous le couvercle
profile.append((R - 0.0007, z_seam - 0.0001, v_at(z_seam - 0.0001)))
profile.append((r_lid - 0.0004, z_seam + 0.0002, v_at(z_seam + 0.0002)))
profile.append((r_lid, z_seam + 0.0009, v_at(z_seam + 0.0009)))
profile.append((r_lid, (z_seam + H - F_TOP) / 2, v_at((z_seam + H - F_TOP) / 2)))
for k in range(steps + 1):  # arrondi du bord du couvercle
    a = (math.pi / 2) * k / steps
    profile.append((r_lid - F_TOP + F_TOP * math.cos(a), H - F_TOP + F_TOP * math.sin(a), V_TOP + (1 - V_TOP) * k / steps))

verts, faces, uvs, fmats = [], [], [], []
for (r, z, _v) in profile:
    for j in range(SEG):
        verts.append(ring(r, z, j))
for i in range(len(profile) - 1):
    for j in range(SEG):
        j2 = (j + 1) % SEG
        faces.append((i * SEG + j, i * SEG + j2, (i + 1) * SEG + j2, (i + 1) * SEG + j))
        u0, u1 = j / SEG, (j + 1) / SEG
        v0, v1 = profile[i][2], profile[i + 1][2]
        uvs += [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        fmats.append(0)

# Fond et dessus : un éventail autour du centre, en projection à plat
bottom_c = len(verts); verts.append((0, 0, 0))
top_c = len(verts); verts.append((0, 0, H))
r_bot, r_top = profile[0][0], profile[-1][0]
last = (len(profile) - 1) * SEG
for j in range(SEG):
    j2 = (j + 1) % SEG
    faces.append((bottom_c, j2, j))
    uvs += [(0.5, 0.5)] + [(0.5 + verts[q][0] / (2 * r_bot), 0.5 + verts[q][1] / (2 * r_bot)) for q in (j2, j)]
    fmats.append(2)
    faces.append((top_c, last + j, last + j2))
    uvs += [(0.5, 0.5)] + [(0.5 + verts[q][0] / (2 * r_top), 0.5 + verts[q][1] / (2 * r_top)) for q in (last + j, last + j2)]
    fmats.append(1)

paper = material("POT_papier", "paper.jpg", rough=0.66)
body = new_object(
    "POT_corps", verts, faces, uvs,
    [material("POT_etiquette", WRAP, rough=0.62), material("POT_dessus", "lid-top.jpg", rough=0.62), paper],
    fmats,
)

# --- Le strap rouge : une bande de tissu à cheval sur la couture -----------
r_strap = r_lid + 0.0006
sv, sf, suv = [], [], []
rows = [(-STRAP_H / 2, -0.0003, 0.0), (0.0, 0.0003, 0.5), (STRAP_H / 2, -0.0003, 1.0)]
for (dz, dr, _v) in rows:
    for j in range(SEG):
        t = 2 * math.pi * j / SEG
        wobble = 0.00035 * math.sin(3 * t + 1.0) + 0.0002 * math.sin(7 * t + 0.4)  # un tissu ne tombe jamais droit
        sv.append(ring(r_strap + dr, z_seam + dz + wobble, j))
for i in range(len(rows) - 1):
    for j in range(SEG):
        j2 = (j + 1) % SEG
        sf.append((i * SEG + j, i * SEG + j2, (i + 1) * SEG + j2, (i + 1) * SEG + j))
        suv += [(j / SEG, rows[i][2]), ((j + 1) / SEG, rows[i][2]), ((j + 1) / SEG, rows[i + 1][2]), (j / SEG, rows[i + 1][2])]
strap_mat = material("POT_strap", "strap.jpg", rough=0.9, uv_scale=(4.0, 1.0))
strap = new_object("POT_strap", sv, sf, suv, [strap_mat])

# Le bout qui pend, à gauche de la face : une languette découpée dans la photo
t0 = math.radians(-55)
tan = (math.cos(t0), math.sin(t0), 0.0)
nor = (math.sin(t0), -math.cos(t0), 0.0)
TW, TL, TSEG = 0.0150, 0.0375, 8
tv, tf, tuv = [], [], []
for k in range(TSEG + 1):
    f = k / TSEG
    out = 0.0009 + 0.0045 * f * f          # il s'écarte du pot en descendant
    lean = -0.0035 * f                     # et part un peu de travers
    z = z_seam + 0.0045 - TL * f
    for side in (-0.5, 0.5):
        tv.append(tuple((r_strap * nor[c]) + nor[c] * out + tan[c] * (side * TW + lean) + (z if c == 2 else 0.0) for c in range(3)))
for k in range(TSEG):
    a = 2 * k
    tf.append((a, a + 1, a + 3, a + 2))
    tuv += [(0.0, 1 - k / TSEG), (1.0, 1 - k / TSEG), (1.0, 1 - (k + 1) / TSEG), (0.0, 1 - (k + 1) / TSEG)]
tail = new_object("POT_strap_bout", tv, tf, tuv, [material("POT_strap_bout", "tail.png", rough=0.9, alpha=True)])

# --- Les pastilles de cire rouge -------------------------------------------
wax = material("POT_pastille", color=(0.56, 0.012, 0.03), rough=0.3)
noise = bpy.data.textures.new("POT_cire", type="CLOUDS")
noise.noise_scale = 0.004


def seal(name, radius, location, rotation, flat_axis):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=radius, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale[flat_axis] = 0.2
    mod = obj.modifiers.new("cire", "DISPLACE")
    mod.texture = noise
    mod.strength = 0.0003
    for p in obj.data.polygons:
        p.use_smooth = True
    obj.data.materials.append(wax)
    return obj


ts = math.radians(44)
seal_front = seal("POT_pastille_face", 0.0054, (r_lid * math.sin(ts), -r_lid * math.cos(ts), H - 0.0110), (0, 0, ts), 1)
seal_top = seal("POT_pastille_dessus", 0.0054, (0.0, -0.0120, H), (0, 0, 0), 2)

# Tout le pot sous un seul parent : c'est lui qu'on tourne
root = bpy.data.objects.new("POT_CRI", None)
scene.collection.objects.link(root)
parts = [body, strap, tail, seal_front, seal_top]
for o in parts:
    o.parent = root

# --- Export du modèle (avant le décor de rendu) -----------------------------
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
for o in parts + [root]:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, NAME + ".glb"), export_format="GLB", use_selection=True,
    export_apply=True, export_image_format="AUTO", export_yup=True,
)

# --- Décor de contrôle : fond bleu, soleil dur, appareil à hauteur de pot ---
klein = material("DECOR_klein", color=(0.006, 0.04, 0.57), rough=0.85)
bv, bf_, buv = [], [], []
prof = [(-1.2, 0.0), (0.25, 0.0)] + [(0.25 + 0.2 * math.sin(a), 0.2 - 0.2 * math.cos(a)) for a in [math.pi / 2 * k / 12 for k in range(1, 13)]] + [(0.45, 1.2)]
for (y, z) in prof:
    bv += [(-1.5, y, z), (1.5, y, z)]
for k in range(len(prof) - 1):
    bf_.append((2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2))
    buv += [(0, 0), (1, 0), (1, 1), (0, 1)]
new_object("DECOR_fond", bv, bf_, buv, [klein])

world = bpy.data.worlds.new("DECOR_monde")
scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.55, 0.6, 0.75, 1.0)
bg.inputs["Strength"].default_value = 0.12


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


def light(name, kind, energy, location, rotation, **kw):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    for key, val in kw.items():
        setattr(data, key, val)
    obj = bpy.data.objects.new(name, data)
    obj.location, obj.rotation_euler = location, rotation
    scene.collection.objects.link(obj)
    return obj


# Puissances mesurées : au-delà, le papier brûle et l'étiquette se délave.
light("LGT_soleil", "SUN", 1.5, (0.5, -1.0, 1.0), (math.radians(52), 0, math.radians(28)), angle=math.radians(1.2))
light("LGT_debouche", "AREA", 3.2, (-0.7, -0.6, 0.35), (math.radians(78), 0, math.radians(-50)), size=0.9)


def camera(name, location, target, lens):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    scene.collection.objects.link(obj)
    aim = bpy.data.objects.new(name + "_cible", None)
    aim.location = target
    scene.collection.objects.link(aim)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    return obj


cam_main = camera("CAM_face", (0.0, -0.62, 0.105), (0.0, 0.0, 0.068), 85)
cam_top = camera("CAM_dessus", (0.0, -0.30, 0.50), (0.0, 0.0, 0.085), 85)

net(scene, 128)
scene.render.resolution_x, scene.render.resolution_y = 1000, 1200
scene.render.image_settings.file_format = "PNG"

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, NAME + ".blend"))


def render(name, cam, angle_deg):
    root.rotation_euler = (0, 0, math.radians(angle_deg))
    scene.camera = cam
    scene.render.filepath = os.path.join(OUT, "renders", name)
    bpy.ops.render.render(write_still=True)


if VIEWS in ("all", "turntable"):
    render(SHOT + "-face.png", cam_main, 0)
    render(SHOT + "-trois-quarts-gauche.png", cam_main, 38)
    render(SHOT + "-trois-quarts-droit.png", cam_main, -38)
    render(SHOT + "-dos.png", cam_main, 180)
    render(SHOT + "-dessus.png", cam_top, 0)
if VIEWS == "turntable":
    scene.render.resolution_x, scene.render.resolution_y = 720, 864
    scene.cycles.samples = 40
    for f in range(48):
        render(os.path.join("..", "turntable", f"pot-{f:02d}.png"), cam_main, -360 * f / 48)

print("POT_OK", os.path.join(OUT, NAME + ".glb"))
