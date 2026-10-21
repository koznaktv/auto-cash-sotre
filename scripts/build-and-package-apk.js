const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');
const androidCliDir = 'C:\\AutoCashAndroid';
const androidSrcDir = path.join(parentDir, 'AUTO_CASH_ANDROID');
const targetUserApkDir = path.join(parentDir, 'apk');
const targetWebDownloadDir = path.join(rootDir, 'public', 'download');

console.log('=== AUTO CASH APK Automation Build Pipeline ===');

// 1. Read current version from C:\AutoCashAndroid\app\build.gradle
const buildGradlePath = path.join(androidCliDir, 'app', 'build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.error('Error: build.gradle not found at', buildGradlePath);
  process.exit(1);
}

const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
const versionMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);
const currentVersion = versionMatch ? versionMatch[1] : '1.1.0';

console.log(`Current App Version: v${currentVersion}`);

// 2. Ensure directories exist
if (!fs.existsSync(targetUserApkDir)) fs.mkdirSync(targetUserApkDir, { recursive: true });
if (!fs.existsSync(targetWebDownloadDir)) fs.mkdirSync(targetWebDownloadDir, { recursive: true });

// 3. Build APK with Gradle in C:\AutoCashAndroid
console.log('Building Android Debug APK with assembleDebug...');
const env = {
  ...process.env,
  JAVA_HOME: 'C:\\Program Files\\Microsoft\\jdk-17.0.20.101-hotspot',
};

try {
  execSync('cmd.exe /c "gradlew.bat assembleDebug --no-daemon"', {
    cwd: androidCliDir,
    env,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Gradle assembleDebug failed:', err.message);
  process.exit(1);
}

// 4. Find generated APK
const apkOutputDir = path.join(androidCliDir, 'app', 'build', 'outputs', 'apk', 'debug');
const sourceApk = path.join(apkOutputDir, 'app-debug.apk');

if (!fs.existsSync(sourceApk)) {
  console.error('Error: Built APK not found at', sourceApk);
  process.exit(1);
}

const apkSize = fs.statSync(sourceApk).size;
const sizeMb = (apkSize / (1024 * 1024)).toFixed(2);
console.log(`Successfully built APK: ${sourceApk} (${sizeMb} MB / ${apkSize} bytes)`);

// 5. Copy to user's apk folder
const dest1 = path.join(targetUserApkDir, 'autocash.apk');
const dest1Versioned = path.join(targetUserApkDir, `autocash_v${currentVersion}.apk`);
const dest2 = path.join(targetWebDownloadDir, 'autocash.apk');

fs.copyFileSync(sourceApk, dest1);
fs.copyFileSync(sourceApk, dest1Versioned);
fs.copyFileSync(sourceApk, dest2);

console.log(`[1] Placed in user folder: ${dest1}`);
console.log(`[2] Placed versioned copy: ${dest1Versioned}`);
console.log(`[3] Placed in web download: ${dest2}`);

console.log('=== APK BUILD & PACKAGING COMPLETE ===');
