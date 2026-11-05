import os
import shutil
import subprocess
import re
from PIL import Image

ANDROID_DIR = r"C:\AutoCashAndroid"
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
AUTO_CASH_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public"))
MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

def update_mipmap_icons(icon_source_path):
    src = Image.open(icon_source_path).convert("RGBA")
    res_dir = os.path.join(ANDROID_DIR, "app", "src", "main", "res")
    for folder, size in MIPMAP_SIZES.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. Standard full-size launcher icon
        resized = src.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        resized.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
        
        # 2. Adaptive icon foreground (centered with 15% safe padding so the gold border and badge are 100% visible inside Android masks)
        fg_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        inner_size = int(size * 0.82)
        inner_icon = src.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (size - inner_size) // 2
        fg_canvas.paste(inner_icon, (offset, offset), inner_icon)
        fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
        
    print(f"Updated all mipmap icons (standard, round, foreground) from {icon_source_path}")

def build_app_apk(app_id, app_name, app_url, icon_path, output_apk_name):
    print(f"\n==========================================")
    print(f"Building Dedicated APK for: {app_name} ({app_id})")
    print(f"Package ID: com.maxbazar.{app_id}")
    print(f"Target URL: {app_url}")
    print(f"==========================================")

    build_gradle = os.path.join(ANDROID_DIR, "app", "build.gradle")
    res_dir = os.path.join(ANDROID_DIR, "app", "src", "main", "res")

    # Safe external backup paths (NEVER inside res/)
    backup_gradle = os.path.join(ANDROID_DIR, "backup_build.gradle")
    backup_strings_map = {}

    # Clean any lingering .bak files inside res
    lingering_bak = os.path.join(ANDROID_DIR, "app", "src", "main", "res", "values", "strings.xml.bak")
    if os.path.exists(lingering_bak):
        os.remove(lingering_bak)

    shutil.copy2(build_gradle, backup_gradle)

    # Backup ALL strings.xml in all values directories (values, values-en, values-ar, values-ru, values-tr)
    for folder in os.listdir(res_dir):
        if folder.startswith("values"):
            s_file = os.path.join(res_dir, folder, "strings.xml")
            if os.path.exists(s_file):
                b_file = os.path.join(ANDROID_DIR, f"backup_{folder}_strings.xml")
                shutil.copy2(s_file, b_file)
                backup_strings_map[s_file] = b_file

    try:
        # 1. Update build.gradle with dedicated package applicationId using Regex
        with open(build_gradle, "r", encoding="utf-8") as f:
            gradle_content = f.read()

        package_id = f"com.maxbazar.{app_id}"
        gradle_content = re.sub(r'applicationId\s+["\'][^"\']+["\']', f'applicationId "{package_id}"', gradle_content)
        gradle_content = re.sub(r'versionCode\s+\d+', 'versionCode 2', gradle_content)
        gradle_content = re.sub(r'versionName\s+["\'][^"\']+["\']', 'versionName "2.0.0"', gradle_content)

        with open(build_gradle, "w", encoding="utf-8") as f:
            f.write(gradle_content)

        # 2. Update strings.xml across ALL locale folders (English, Uyghur/Default, Arabic, Russian, Turkish)
        for s_file in backup_strings_map.keys():
            with open(s_file, "r", encoding="utf-8") as f:
                content = f.read()

            content = re.sub(r'<string name="app_name">[^<]+</string>', f'<string name="app_name">{app_name}</string>', content)
            content = re.sub(r'<string name="app_url">[^<]+</string>', f'<string name="app_url">{app_url}</string>', content)

            with open(s_file, "w", encoding="utf-8") as f:
                f.write(content)

        print(f"Updated strings in {len(backup_strings_map)} locale directories to '{app_name}'")

        # 3. Update Launcher Icons
        update_mipmap_icons(icon_path)

        # 4. Run Gradle assembleDebug
        env = os.environ.copy()
        env["JAVA_HOME"] = JAVA_HOME

        cmd = 'cmd.exe /c "gradlew.bat assembleDebug --no-daemon"'
        print("Running Gradle build...")
        res = subprocess.run(cmd, cwd=ANDROID_DIR, env=env, capture_output=True, text=True, shell=True)
        if res.returncode != 0:
            print("Gradle Build Failed:")
            print(res.stderr or res.stdout)
            raise RuntimeError(f"Build failed for {app_id}")

        # 5. Copy Output APK
        built_apk = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
        if not os.path.exists(built_apk):
            raise FileNotFoundError(f"Built APK not found at {built_apk}")

        dest_apk = os.path.join(AUTO_CASH_PUBLIC, "download", output_apk_name)
        os.makedirs(os.path.dirname(dest_apk), exist_ok=True)
        shutil.copy2(built_apk, dest_apk)
        size_mb = os.path.getsize(dest_apk) / (1024 * 1024)
        print(f"SUCCESS: Generated {dest_apk} ({size_mb:.2f} MB)")

    finally:
        # Restore backups
        if os.path.exists(backup_gradle):
            shutil.copy2(backup_gradle, build_gradle)
            os.remove(backup_gradle)

        for s_file, b_file in backup_strings_map.items():
            if os.path.exists(b_file):
                shutil.copy2(b_file, s_file)
                os.remove(b_file)

        print("Restored original Android configuration.")

if __name__ == "__main__":
    # Clean any .bak in res
    lingering_bak = os.path.join(ANDROID_DIR, "app", "src", "main", "res", "values", "strings.xml.bak")
    if os.path.exists(lingering_bak):
        os.remove(lingering_bak)

    # 1. Build dedicated PUBG Mobile APK
    build_app_apk(
        app_id="pubg",
        app_name="PUBG Mobile UC",
        app_url="https://auto-cash.app/apps/pubg",
        icon_path=os.path.join(AUTO_CASH_PUBLIC, "images", "apps", "pubg", "icon-512.png"),
        output_apk_name="pubg-maxbazar.apk"
    )

    # 2. Build dedicated Honor of Kings APK
    build_app_apk(
        app_id="hok",
        app_name="Honor of Kings Token",
        app_url="https://auto-cash.app/apps/honor-of-kings",
        icon_path=os.path.join(AUTO_CASH_PUBLIC, "images", "apps", "honor-of-kings", "icon-512.png"),
        output_apk_name="hok-maxbazar.apk"
    )

    print("\nALL DEDICATED APKS GENERATED SUCCESSFULLY!")
