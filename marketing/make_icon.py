"""Genera el icono de la extension (rounded square naranja + price tag con
franjas de categorias) en 16/48/128/512 px. Sin logo de Amazon."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os

S = 512  # supersample
root = os.path.join(os.path.dirname(__file__), "..")
icons_dir = os.path.join(root, "src", "icons")
os.makedirs(icons_dir, exist_ok=True)

# --- Fondo: gradiente naranja diagonal ---
top = (255, 176, 52)   # #FFB034
bot = (244, 120, 0)    # #F47800
grad = Image.new("RGB", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / (S - 1)
    gd.line([(0, y), (S, y)], fill=(
        round(top[0] * (1 - t) + bot[0] * t),
        round(top[1] * (1 - t) + bot[1] * t),
        round(top[2] * (1 - t) + bot[2] * t),
    ))

mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=116, fill=255)

base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
base.paste(grad, (0, 0), mask)

# --- Etiqueta (price tag) en su propia capa ---
tag = Image.new("RGBA", (S, S), (0, 0, 0, 0))
td = ImageDraw.Draw(tag)
WHITE = (255, 255, 255, 255)

# cuerpo de la etiqueta (rectangulo redondeado) + punta superior
td.rounded_rectangle([138, 198, 374, 420], radius=28, fill=WHITE)
td.polygon([(256, 92), (384, 214), (128, 214)], fill=WHITE)

# agujero de la etiqueta (perfora -> deja ver el naranja)
td.ellipse([256 - 30, 150, 256 + 30, 210], fill=(0, 0, 0, 0))
# aro sutil alrededor del agujero
td.ellipse([256 - 38, 142, 256 + 38, 218], outline=(245, 124, 0, 90), width=6)

# tres franjas = categorias, en los colores reales de los flags
green = (52, 168, 83, 255)
blue = (66, 133, 244, 255)
purple = (156, 39, 176, 255)
stripes = [(262, green, 150), (312, blue, 120), (362, purple, 92)]
x0 = 178
for y, color, length in stripes:
    td.rounded_rectangle([x0, y - 14, x0 + length, y + 14], radius=14, fill=color)

# inclina la etiqueta
tag = tag.rotate(-14, resample=Image.BICUBIC, center=(256, 280))

# --- Sombra suave bajo la etiqueta ---
alpha = tag.split()[3]
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
shadow.paste((0, 0, 0, 110), (0, 0), alpha)
shadow = shadow.filter(ImageFilter.GaussianBlur(12))
shifted = Image.new("RGBA", (S, S), (0, 0, 0, 0))
shifted.paste(shadow, (8, 14))

base.alpha_composite(shifted)
base.alpha_composite(tag)

# recorta todo al rounded square
r, g, b, a = base.split()
base = Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, mask)))

# --- Exporta ---
for size in (16, 48, 128):
    base.resize((size, size), Image.LANCZOS).save(os.path.join(icons_dir, f"{size}.png"))
base.resize((512, 512), Image.LANCZOS).save(os.path.join(root, "marketing", "icon-512.png"))
# preview grande sobre fondo neutro
prev = Image.new("RGBA", (640, 360), (24, 32, 46, 255))
ic = base.resize((220, 220), Image.LANCZOS)
prev.alpha_composite(ic, (210, 70))
prev.convert("RGB").save(os.path.join(root, "marketing", "icon-preview.png"))
print("Iconos generados: 16, 48, 128 en src/icons/ + icon-512.png y preview")
