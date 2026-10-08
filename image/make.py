"""Rasmli taklifnoma (JPG) generatori.

Ishlatish:  python3 make.py
Natija:     taklifnoma.jpg (2551x3579, chop etish uchun 300 dpi) va preview.jpg

Quyidagi CONFIG qismidagi matnlarni o'zingizniki bilan almashtiring.
"""
import os, numpy as np, qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ======================= CONFIG =======================
GREETING  = 'TO MY BEST FRIEND'                 # yuqoridagi kichik sarlavha
GUEST     = 'Alex Morgan'                       # taklif qilinayotgan mehmon
INVITE    = 'With all my heart, I invite you to the wedding of'
COUPLE    = 'Jasur & Madina'                    # kuyov & kelin
MESSAGE   = "I can’t imagine the happiest day of my life without you by my side."
TAGLINE   = "IT WOULDN’T BE THE SAME WITHOUT YOU"
DATE      = 'SATURDAY, 12 JUNE 2027'
TIME      = 'AT 18:00'
VENUE     = 'Bahor Wedding Hall'
AREA      = 'CHILONZOR DISTRICT, TASHKENT'
SIGNATURE = 'Your friend forever, Jasur'
MAP_URL   = 'https://maps.google.com/?q=Chilonzor,Tashkent'   # QR kod shu manzilga olib boradi
OUT       = 'taklifnoma.jpg'
# ======================================================

S = os.path.dirname(os.path.abspath(__file__))
F = S + '/fonts/'

frame = Image.open(S + '/frame.png').convert('RGB')
W, H = frame.size
fr = np.array(frame).astype(float)
# clean stray light-gray shapes below the photo zone and the centre seam
lum = fr.mean(axis=2)
lg = (lum < 255) & (np.ptp(fr, axis=2) < 8)
lg[:1966] = False
fr[lg] = 255
seam = (fr[:, 1273].mean(axis=1) > 250) & (fr[:, 1277].mean(axis=1) > 250)
fr[seam, 1274:1277] = 255

# --- photo: clean part of mockup photo, scaled to cover the photo zone ---
mk = Image.open(S + '/photo.jpg').convert('RGB')
photo = mk.crop((420, 196, 1512, 800))
PH = 1966
scale = PH / photo.height
pw = round(photo.width * scale)
photo = photo.resize((pw, PH), Image.LANCZOS)
photo = photo.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
left = (pw - W) // 2 + 60
photo = photo.crop((left, 0, left + W, PH))
ph = np.full((H, W, 3), 255.0)
ph[:PH] = np.array(photo).astype(float)
FADE = 1830
t = (np.clip((np.arange(H) - FADE) / (PH - FADE), 0, 1) ** 1.6)[:, None, None]
ph = ph * (1 - t) + 255 * t

# --- alpha of the frame artwork over the checkerboard placeholder ---
P, X0, Y0 = 104.6, 27.5, 79.5
yy, xx = np.mgrid[0:H, 0:W]
cell = (np.floor((xx - X0) / P) + np.floor((yy - Y0) / P)) % 2
c = np.where(cell == 0, 105.0, 159.0)
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
gray = (np.abs(r - g) < 8) & (np.abs(g - b) < 8)
v = fr.mean(axis=2)
alpha = np.clip((v - c) / (255 - c), 0, 1)
alpha[v <= 166] = 0
alpha[~gray] = 1
alpha[yy > PH] = 1
a = alpha[..., None]
out = ph * (1 - a) + fr * a
img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
d = ImageDraw.Draw(img)

GOLD = (178, 98, 30)
BROWN = (120, 66, 22)

def font(name, size, var=None):
    f = ImageFont.truetype(F + name, size)
    if var:
        f.set_variation_by_name(var)
    return f

def spaced_width(text, f, tr):
    return sum(f.getlength(ch) for ch in text) + tr * (len(text) - 1)

def text_c(y, text, f, fill=GOLD, tr=0, cx=W / 2):
    if tr == 0:
        d.text((cx, y), text, font=f, fill=fill, anchor='ms')
        return
    x = cx - spaced_width(text, f, tr) / 2
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill, anchor='ls')
        x += f.getlength(ch) + tr

def gradient_text(y, text, f, c1, c2):
    bbox = d.textbbox((W / 2, y), text, font=f, anchor='ms')
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).text((W / 2, y), text, font=f, fill=255, anchor='ms')
    grad = Image.new('RGB', img.size)
    gd = ImageDraw.Draw(grad)
    y0, y1 = bbox[1], bbox[3]
    for yy_ in range(H):
        t = min(max((yy_ - y0) / max(y1 - y0, 1), 0), 1)
        gd.line([(0, yy_), (W, yy_)], fill=tuple(round(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    img.paste(grad, (0, 0), m)

mont_l = lambda s: font('Montserrat[wght].ttf', s, 'Light')
mont_r = lambda s: font('Montserrat[wght].ttf', s, 'Regular')
corm_i = lambda s: font('CormorantGaramond-Italic[wght].ttf', s, 'Medium Italic')
vibes = lambda s: font('GreatVibes-Regular.ttf', s)

text_c(2070, GREETING, mont_l(44), tr=14)
gradient_text(2205, GUEST, vibes(130), (205, 140, 55), (150, 78, 18))
text_c(2305, INVITE, corm_i(62), fill=BROWN)

gradient_text(2525, COUPLE, vibes(230), (205, 140, 55), (150, 78, 18))

text_c(2695, MESSAGE, corm_i(60), fill=BROWN)
text_c(2855, TAGLINE, mont_l(40), tr=9)

# between the two gold rules (y 2920..3038)
mid = 2997
text_c(mid, DATE, mont_r(48), tr=6, cx=W * 0.40)
d.line([(W * 0.645, 2950), (W * 0.645, 3008)], fill=GOLD, width=3)
text_c(mid, TIME, mont_r(48), tr=6, cx=W * 0.74)

# bottom: venue + signature on the left, location QR on the right
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=1, box_size=10)
qr.add_data(MAP_URL)
qr.make(fit=True)
qimg = qr.make_image(fill_color=(70, 38, 10), back_color='white').convert('RGB')
QS = 270
qimg = qimg.resize((QS, QS), Image.NEAREST)
qx, qy = 1790, 3075
d.rounded_rectangle([qx - 14, qy - 14, qx + QS + 14, qy + QS + 14], radius=18, outline=GOLD, width=3, fill='white')
img.paste(qimg, (qx, qy))
text_c(qy + QS + 50, 'SCAN FOR LOCATION', mont_r(24), tr=5, cx=qx + QS / 2)

lx = 1060
text_c(3130, VENUE, corm_i(74), fill=BROWN, cx=lx)
text_c(3195, AREA, mont_l(34), tr=9, cx=lx)
text_c(3325, SIGNATURE, vibes(96), fill=GOLD, cx=lx)

img.save(S + '/' + OUT, quality=95, subsampling=0, dpi=(300, 300))
img.resize((W // 3, H // 3), Image.LANCZOS).save(S + '/preview.jpg', quality=90)
