import os
import sys
import math
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_branded_app_icon(
    input_game_icon_path: str,
    output_dir: str,
    app_label: str = "MAX-BAZAR",
    sub_label: str = "OFFICIAL STORE",
    medallion_path: str = None
):
    """
    Creates a luxury 4-border MAX-BAZAR branded icon set:
    - icon-512.png (Standard 512x512)
    - icon-192.png (Standard 192x192)
    - icon-512-maskable.png (Safe-padded 512x512 for Android/iOS adaptive squircle/circle masks)
    """
    os.makedirs(output_dir, exist_ok=True)
    W, H = 512, 512

    # 1. Load Raw Game Icon
    if not os.path.exists(input_game_icon_path):
        raise FileNotFoundError(f"Source game icon not found: {input_game_icon_path}")
    raw_game = Image.open(input_game_icon_path).convert('RGBA')

    # Load Medallion
    medallion = None
    if medallion_path and os.path.exists(medallion_path):
        medallion = Image.open(medallion_path).convert('RGBA')
    else:
        # Default fallback path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        fallback = os.path.join(script_dir, '..', 'public', 'images', 'maxbazar', 'v3', 'maxbazar_gold_round.png')
        if os.path.exists(fallback):
            medallion = Image.open(fallback).convert('RGBA')

    def render_framed_icon(canvas_w, canvas_h, safe_padding=0):
        # Base canvas - dark obsidian navy
        canvas = Image.new('RGBA', (canvas_w, canvas_h), (8, 12, 22, 255))
        
        effective_w = canvas_w - safe_padding * 2
        effective_h = canvas_h - safe_padding * 2
        offset_x = safe_padding
        offset_y = safe_padding
        
        scale = effective_w / 512.0
        frame_pad = int(22 * scale)
        game_w = effective_w - frame_pad * 2
        game_h = effective_h - frame_pad * 2
        
        # Resize raw game artwork
        game_resized = raw_game.resize((game_w, game_h), Image.Resampling.LANCZOS)
        
        # Rounded mask for game artwork
        corner_r = int(72 * scale)
        game_mask = Image.new('L', (game_w, game_h), 0)
        g_draw = ImageDraw.Draw(game_mask)
        g_draw.rounded_rectangle((0, 0, game_w, game_h), radius=corner_r, fill=255)
        
        # Paste game artwork inside canvas
        canvas.paste(game_resized, (offset_x + frame_pad, offset_y + frame_pad), game_mask)
        
        # Frame & Branding overlay
        overlay = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Multi-layer Metallic Gold Border along all 4 edges
        outer_r = int(90 * scale)
        for b in range(frame_pad):
            pct = b / float(frame_pad)
            # Gold shimmer gradient
            if b < 4:
                # Bright outer rim
                col = (254, 240, 138, 255)
            elif b < 10:
                col = (245, 158, 11, int(255 - pct * 60))
            elif b < 16:
                col = (217, 119, 6, 230)
            else:
                col = (146, 64, 14, 210)
                
            rx = offset_x + b
            ry = offset_y + b
            rw = offset_x + effective_w - 1 - b
            rh = offset_y + effective_h - 1 - b
            cur_r = max(12, int(outer_r - b * 0.9))
            draw.rounded_rectangle((rx, ry, rw, rh), radius=cur_r, outline=col, width=1)
            
        # Inner hairline bevel
        draw.rounded_rectangle(
            (offset_x + frame_pad, offset_y + frame_pad, offset_x + effective_w - frame_pad, offset_y + effective_h - frame_pad),
            radius=corner_r,
            outline=(254, 240, 138, 240),
            width=2
        )
        
        # 4 Ornate Gold Corner Accent Plates
        stud_d = int(32 * scale)
        stud_r = max(3, int(6 * scale))
        
        corners = [
            (offset_x + stud_d, offset_y + stud_d), # Top-Left
            (offset_x + effective_w - stud_d, offset_y + stud_d), # Top-Right
            (offset_x + stud_d, offset_y + effective_h - stud_d), # Bottom-Left
            (offset_x + effective_w - stud_d, offset_y + effective_h - stud_d) # Bottom-Right
        ]
        
        for cx, cy in corners:
            # Diamond gold stud
            draw.ellipse(
                (cx - stud_r, cy - stud_r, cx + stud_r, cy + stud_r),
                fill=(254, 240, 138, 255),
                outline=(217, 119, 6, 255),
                width=2
            )
            draw.point((cx, cy), fill=(255, 255, 255, 255))
            
        # Bottom Brand Banner ("MAX-BAZAR OFFICIAL STORE")
        banner_w = int(340 * scale)
        banner_h = int(64 * scale)
        banner_x = offset_x + (effective_w - banner_w) // 2
        banner_y = offset_y + effective_h - banner_h - int(12 * scale)
        
        # Drop shadow for banner
        draw.rounded_rectangle(
            (banner_x - 2, banner_y - 1, banner_x + banner_w + 2, banner_y + banner_h + 3),
            radius=int(14 * scale),
            fill=(0, 0, 0, 180)
        )
        
        # Banner body (Midnight Obsidian Navy with Gold border)
        draw.rounded_rectangle(
            (banner_x, banner_y, banner_x + banner_w, banner_y + banner_h),
            radius=int(12 * scale),
            fill=(8, 14, 28, 248),
            outline=(245, 158, 11, 255),
            width=max(2, int(3 * scale))
        )
        
        # Inner hairline
        draw.rounded_rectangle(
            (banner_x + 3, banner_y + 3, banner_x + banner_w - 3, banner_y + banner_h - 3),
            radius=int(9 * scale),
            outline=(253, 230, 138, 180),
            width=1
        )
        
        # Banner typography
        try:
            font_title = ImageFont.truetype("arialbd.ttf", int(22 * scale))
            font_sub = ImageFont.truetype("arialbd.ttf", int(11 * scale))
        except Exception:
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            
        # Title text: MAX-BAZAR
        t_box = draw.textbbox((0, 0), app_label, font=font_title)
        tw = t_box[2] - t_box[0]
        th = t_box[3] - t_box[1]
        
        # Sub title text: OFFICIAL STORE (using clean ascii dash separator)
        clean_sub = f"- {sub_label} -"
        s_box = draw.textbbox((0, 0), clean_sub, font=font_sub)
        sw = s_box[2] - s_box[0]
        
        tx = banner_x + (banner_w - tw) // 2
        ty = banner_y + int(8 * scale)
        
        # Title shadow & gold gradient fill
        draw.text((tx + 1, ty + 1), app_label, font=font_title, fill=(0, 0, 0, 220))
        draw.text((tx, ty), app_label, font=font_title, fill=(255, 215, 0, 255))
        
        # Sub title
        sx = banner_x + (banner_w - sw) // 2
        sy = ty + th + int(6 * scale)
        draw.text((sx, sy), clean_sub, font=font_sub, fill=(191, 219, 254, 240))
        
        # Composite frame onto canvas
        final_img = Image.alpha_composite(canvas, overlay)
        
        # Top-Right 3D Medallion (Official MAX-BAZAR Seal)
        if medallion:
            med_size = int(104 * scale)
            med_resized = medallion.resize((med_size, med_size), Image.Resampling.LANCZOS)
            
            med_x = offset_x + effective_w - med_size - int(12 * scale)
            med_y = offset_y + int(12 * scale)
            
            # Subtle radial shadow under medallion
            shadow = Image.new('RGBA', (med_size + 16, med_size + 16), (0, 0, 0, 0))
            s_draw = ImageDraw.Draw(shadow)
            s_draw.ellipse((4, 4, med_size + 12, med_size + 12), fill=(0, 0, 0, 180))
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=6))
            
            final_img.paste(shadow, (med_x - 8, med_y - 8), shadow)
            final_img.paste(med_resized, (med_x, med_y), med_resized)
            
        return final_img

    # 1. Generate icon-512.png (Full resolution standard)
    icon_512 = render_framed_icon(512, 512, safe_padding=0)
    out_512_path = os.path.join(output_dir, "icon-512.png")
    icon_512.save(out_512_path, format="PNG", optimize=True)
    print(f"Saved: {out_512_path}")

    # 2. Generate icon-192.png (Standard 192x192)
    icon_192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    out_192_path = os.path.join(output_dir, "icon-192.png")
    icon_192.save(out_192_path, format="PNG", optimize=True)
    print(f"Saved: {out_192_path}")

    # 3. Generate icon-512-maskable.png (Safe zone padded 42px for phone adaptive squircles/circles)
    icon_maskable = render_framed_icon(512, 512, safe_padding=42)
    out_mask_path = os.path.join(output_dir, "icon-512-maskable.png")
    icon_maskable.save(out_mask_path, format="PNG", optimize=True)
    print(f"Saved: {out_mask_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Brand an app/game icon with MAX-BAZAR 4-border luxury gold styling.")
    parser.add_argument("--input", required=True, help="Path to raw source game icon")
    parser.add_argument("--output-dir", required=True, help="Directory to output icon-512, icon-192, icon-512-maskable")
    parser.add_argument("--app-label", default="MAX-BAZAR", help="Main brand label (default: MAX-BAZAR)")
    parser.add_argument("--sub-label", default="OFFICIAL STORE", help="Sub-label (default: OFFICIAL STORE)")
    parser.add_argument("--medallion", default=None, help="Custom medallion path")

    args = parser.parse_args()
    create_branded_app_icon(
        input_game_icon_path=args.input,
        output_dir=args.output_dir,
        app_label=args.app_label,
        sub_label=args.sub_label,
        medallion_path=args.medallion
    )
