import os
import shutil
import subprocess
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
        resized = src.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save standard, round, and foreground
        resized.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
        resized.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
        resized.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
    print(f"Updated all mipmap icons from {icon_source_path}")

def build_app_apk(app_id, app_name, app_url, icon_path, output_apk_name):
    print(f"\n==========================================")
    print(f"Building APK for: {app_name} ({app_id})")
    print(f"Target URL: {app_url}")
    print(f"==========================================")

    build_gradle = os.path.join(ANDROID_DIR, "app", "build.gradle")
    strings_xml = os.path.join(ANDROID_DIR, "app", "src", "main", "res", "values", "strings.xml")

    # Safe external backup paths (NEVER inside res/)
    backup_gradle = os.path.join(ANDROID_DIR, "backup_build.gradle")
    backup_strings = os.path.join(ANDROID_DIR, "backup_strings.xml")

    # Clean any lingering .bak files inside res
    lingering_bak = os.path.join(ANDROID_DIR, "app", "src", "main", "res", "values", "strings.xml.bak")
    if os.path.exists(lingering_bak):
        os.remove(lingering_bak)

    shutil.copy2(build_gradle, backup_gradle)
    shutil.copy2(strings_xml, backup_strings)

    try:
        # 1. Update build.gradle with dedicated package applicationId
        with open(build_gradle, "r", encoding="utf-8") as f:
            gradle_content = f.read()

        package_id = f"com.maxbazar.{app_id}"
        gradle_content = gradle_content.replace('applicationId "com.autocash.store"', f'applicationId "{package_id}"')
        with open(build_gradle, "w", encoding="utf-8") as f:
            f.write(gradle_content)

        # 2. Update strings.xml with app name and URL
        with open(strings_xml, "r", encoding="utf-8") as f:
            strings_content = f.read()

        strings_content = strings_content.replace('<string name="app_name">AUTO CASH</string>', f'<string name="app_name">{app_name}</string>')
        strings_content = strings_content.replace('<string name="app_url">https://auto-cash-sotre.vercel.app</string>', f'<string name="app_url">{app_url}</string>')
        with open(strings_xml, "w", encoding="utf-8") as f:
            f.write(strings_content)

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
        if os.path.exists(backup_gradle):
            shutil.copy2(backup_gradle, build_gradle)
            os.remove(backup_gradle)
        if os.path.exists(backup_strings):
            shutil.copy2(backup_strings, strings_xml)
            os.remove(backup_strings)
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
