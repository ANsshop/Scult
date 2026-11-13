"""Rend les pistes de logo SCULT en volume, sur fond transparent.

Usage (depuis la racine du repo) :
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
      --python scripts/3d/render_logo.py -- docs/logo/sources sortie/ [marbre|laque|sceau|tout]

Sources : ArchivoBlack-Regular.ttf (la police de titres du site, licence OFL)
et marbre.jpg (la matière). Sorties : PNG transparents, à poser sur n'importe
quel fond ; l'ombre dure se fait en CSS, comme pour le pot.
"""
import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = os.path.abspath(argv[0] if len(argv) > 0 else "docs/logo/sources")
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "docs/logo")
WHICH = argv[2] if len(argv) > 2 else "tout"
FONT = os.path.join(SRC, "ArchivoBlack-Regular.ttf")


def reset(width, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("MONDE")
    scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.75, 0.78, 0.88, 1.0)
    bg.inputs["Strength"].default_value = 0.22
    return scene


def principled(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat, next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def marble():
    """Marbre ivoire : la photo projetée en boîte, et son relief en bosse."""
    mat, bsdf = principled("MARBRE")
    nt = mat.node_tree
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (0.55, 0.55, 0.55)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(os.path.join(SRC, "marbre.jpg"))
    tex.projection = "BOX"
    tex.projection_blend = 0.25
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.38
    return mat


def lacquer(color, rough=0.12):
    mat, bsdf = principled("LAQUE")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.05
    return mat


def wax():
    mat, bsdf = principled("CIRE")
    bsdf.inputs["Base Color"].default_value = (0.36, 0.006, 0.016, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.28
    bsdf.inputs["Subsurface Weight"].default_value = 0.12
    bsdf.inputs["Subsurface Radius"].default_value = (0.4, 0.05, 0.05)
    bsdf.inputs["Subsurface Scale"].default_value = 0.05
    return mat


def text(body, depth, bevel, mat, size=1.0):
    font = bpy.data.fonts.load(FONT)
    curve = bpy.data.curves.new("MOT", "FONT")
    curve.body, curve.font, curve.size = body, font, size
    curve.align_x, curve.align_y = "CENTER", "CENTER"
    curve.space_character = 0.93
    curve.extrude, curve.bevel_depth, curve.bevel_resolution = depth, bevel, 4
    obj = bpy.data.objects.new("MOT", curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.rotation_euler = (math.pi / 2, 0, 0)  # debout, face à -Y
    obj.data.materials.append(mat)
    return obj


def light(kind, energy, location, target=(0, 0, 0), **kw):
    data = bpy.data.lights.new("LGT", kind)
    data.energy = energy
    for k, v in kw.items():
        setattr(data, k, v)
    obj = bpy.data.objects.new("LGT", data)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    aim = bpy.data.objects.new("CIBLE", None)
    aim.location = target
    bpy.context.scene.collection.objects.link(aim)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"


def camera(location, target, lens):
    data = bpy.data.cameras.new("CAM")
    data.lens = lens
    obj = bpy.data.objects.new("CAM", data)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    aim = bpy.data.objects.new("VISEE", None)
    aim.location = target
    bpy.context.scene.collection.objects.link(aim)
    con = obj.constraints.new("TRACK_TO")
    con.target, con.track_axis, con.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    bpy.context.scene.camera = obj


def render(name):
    os.makedirs(OUT, exist_ok=True)
    bpy.context.scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("LOGO_OK", name)


def wordmark(kind):
    """Le mot en volume, vu légèrement de dessous et de côté pour montrer l'épaisseur."""
    reset(2000, 760)
    mat = marble() if kind == "marbre" else lacquer((0.006, 0.04, 0.57))
    word = text("SCULT", 0.16, 0.022 if kind == "marbre" else 0.035, mat)
    bpy.context.view_layer.update()
    half_w, half_h = word.dimensions.x / 2, word.dimensions.y / 2
    if kind == "laque":  # la pastille : une perle de cire rouge, en point final
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.105, location=(half_w + 0.17, -0.05, -half_h + 0.105))
        dot = bpy.context.object
        dot.scale = (1, 0.75, 1)
        for p in dot.data.polygons:
            p.use_smooth = True
        dot.data.materials.append(wax())
    light("SUN", 1.5, (2.2, -3.0, 2.4), angle=math.radians(2))
    light("AREA", 55, (-2.6, -2.4, 0.6), size=2.5)
    light("AREA", 22, (0.5, -1.5, -2.2), size=3.0)
    camera((-1.25, -6.6, -0.95), (0.12 if kind == "laque" else 0.0, 0, 0.0), 52)
    render(f"logo-{kind}.png")


def seal():
    """Le sceau : un cachet de cire rouge frappé d'un S."""
    reset(1000, 1000)
    w = wax()
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.0, depth=0.16, location=(0, 0.08, 0), rotation=(math.pi / 2, 0, 0))
    disc = bpy.context.object
    bev = disc.modifiers.new("arrondi", "BEVEL")
    bev.width, bev.segments = 0.07, 6
    sub = disc.modifiers.new("lisse", "SUBSURF")
    sub.levels = sub.render_levels = 2
    tex = bpy.data.textures.new("CIRE", type="CLOUDS")
    tex.noise_scale = 0.9
    dis = disc.modifiers.new("coulures", "DISPLACE")  # le bord d'un cachet n'est jamais rond
    dis.texture, dis.strength, dis.direction = tex, 0.16, "NORMAL"
    for p in disc.data.polygons:
        p.use_smooth = True
    disc.data.materials.append(w)
    # l'anneau frappé et la lettre, en relief
    bpy.ops.mesh.primitive_torus_add(major_radius=0.72, minor_radius=0.035, major_segments=96, minor_segments=16, location=(0, -0.01, 0), rotation=(math.pi / 2, 0, 0))
    ring = bpy.context.object
    for p in ring.data.polygons:
        p.use_smooth = True
    ring.data.materials.append(w)
    s = text("S", 0.06, 0.02, w, size=1.3)
    s.location = (0, -0.03, 0)
    light("SUN", 1.4, (1.8, -2.6, 2.4), angle=math.radians(3))
    light("AREA", 45, (-2.4, -2.2, 0.8), size=2.5)
    camera((-0.5, -6.0, 0.55), (0, 0, 0), 92)
    render("logo-sceau.png")


if WHICH in ("marbre", "tout"):
    wordmark("marbre")
if WHICH in ("laque", "tout"):
    wordmark("laque")
if WHICH in ("sceau", "tout"):
    seal()
