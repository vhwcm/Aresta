import os
import math
from PIL import Image, ImageDraw

def create_svg_logo(filepath, size=512):
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">
  <defs>
    <!-- Accent Gradient (Laranja Aresta) -->
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E57B55" />
      <stop offset="50%" stop-color="#F08F6B" />
      <stop offset="100%" stop-color="#FFA885" />
    </linearGradient>

    <!-- Dark Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18191C" />
      <stop offset="100%" stop-color="#0A0A0B" />
    </linearGradient>

    <!-- Metallic/Light Gradient -->
    <linearGradient id="lightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#A1A4AB" />
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Card -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" stroke="#E57B55" stroke-opacity="0.25" stroke-width="6" />

  <!-- Subtle Inner Graph Grid Edge Lines -->
  <path d="M 120 380 L 256 120 L 392 380" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Left Stem of "A" (Book/Edge Concept) -->
  <path d="M 140 376 L 256 136 L 226 136 L 110 376 Z" fill="url(#lightGrad)" />

  <!-- Right Stem of "A" (Aresta Accent Edge) -->
  <path d="M 256 136 L 372 376 L 324 376 L 226 170 Z" fill="url(#accentGrad)" filter="url(#glow)" />

  <!-- Geometric Vertex Point (Aresta / Graph Node) -->
  <circle cx="256" cy="136" r="22" fill="#FFA885" />
  <circle cx="256" cy="136" r="12" fill="#FFFFFF" />

  <!-- Horizontal Crossbar (Connecting Edge) -->
  <path d="M 162 300 L 338 300" stroke="url(#accentGrad)" stroke-width="22" stroke-linecap="round" />
  <path d="M 162 300 L 338 300" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-opacity="0.8" />
</svg>
'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)

def create_raster_images(png_path, ico_path, size=512):
    # Draw high quality raster image with Pillow matching logo aesthetics
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    # Colors: bg #0A0A0B, border #E57B55
    margin = int(size * 0.03)
    radius = int(size * 0.2)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(10, 10, 11, 255),
        outline=(229, 123, 85, 200),
        width=int(size * 0.012)
    )

    # Coordinates for "A" logo shape
    cx = size / 2
    top_y = size * 0.26
    bot_y = size * 0.74
    left_x = size * 0.24
    right_x = size * 0.76
    mid_bar_y = size * 0.58

    stroke = int(size * 0.07)

    # Left stem (White/Light silver)
    draw.line([(left_x, bot_y), (cx, top_y)], fill=(242, 242, 242, 255), width=stroke)

    # Right stem (Accent Orange #E57B55)
    draw.line([(cx, top_y), (right_x, bot_y)], fill=(229, 123, 85, 255), width=stroke)

    # Crossbar
    bar_margin = size * 0.08
    draw.line([(left_x + bar_margin, mid_bar_y), (right_x - bar_margin, mid_bar_y)], fill=(240, 143, 107, 255), width=int(stroke * 0.8))

    # Vertex circle at top
    node_r = int(size * 0.05)
    draw.ellipse([cx - node_r, top_y - node_r, cx + node_r, top_y + node_r], fill=(255, 168, 133, 255))
    inner_r = int(size * 0.025)
    draw.ellipse([cx - inner_r, top_y - inner_r, cx + inner_r, top_y + inner_r], fill=(255, 255, 255, 255))

    img.save(png_path, format='PNG')

    # ICO format with multiple standard favicon sizes (16, 32, 48, 64, 128, 256)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format='ICO', sizes=ico_sizes)

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    front_public = os.path.join(project_root, 'front', 'public')
    root_public = os.path.join(project_root, 'public')

    os.makedirs(front_public, exist_ok=True)
    os.makedirs(root_public, exist_ok=True)

    for target_dir in [front_public, root_public]:
        create_svg_logo(os.path.join(target_dir, 'logo.svg'))
        create_svg_logo(os.path.join(target_dir, 'favicon.svg'))
        create_raster_images(
            os.path.join(target_dir, 'logo.png'),
            os.path.join(target_dir, 'favicon.ico')
        )
        # Also copy logo.png to apple-touch-icon.png and favicon.png
        img = Image.open(os.path.join(target_dir, 'logo.png'))
        img.save(os.path.join(target_dir, 'apple-touch-icon.png'))
        img.save(os.path.join(target_dir, 'favicon.png'))
        print(f"Generated logo assets in {target_dir}")
