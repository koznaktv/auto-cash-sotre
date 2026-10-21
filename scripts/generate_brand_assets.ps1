Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH\public\logo.png"
$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

$srcW = $sourceImg.Width
$srcH = $sourceImg.Height

function Generate-All-New-Assets([string]$resDir) {
    # 1. FOREGROUND & LEGACY SIZES
    $sizes = @{
        "mipmap-mdpi"    = @{ Legacy = 48;  Adaptive = 108 }
        "mipmap-hdpi"    = @{ Legacy = 72;  Adaptive = 162 }
        "mipmap-xhdpi"   = @{ Legacy = 96;  Adaptive = 216 }
        "mipmap-xxhdpi"  = @{ Legacy = 144; Adaptive = 324 }
        "mipmap-xxxhdpi" = @{ Legacy = 192; Adaptive = 432 }
    }

    foreach ($folder in $sizes.Keys) {
        $cfg = $sizes[$folder]
        $targetFolder = Join-Path $resDir $folder
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        }

        # --- A. ADAPTIVE FOREGROUND (ic_launcher_foreground.png) ---
        $aDim = [int]$cfg.Adaptive
        $fgBmp = New-Object System.Drawing.Bitmap $aDim, $aDim
        $gA = [System.Drawing.Graphics]::FromImage($fgBmp)
        $gA.Clear([System.Drawing.Color]::Transparent)
        $gA.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gA.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gA.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gA.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # In adaptive icon foreground (108dp canvas), the squircle covers 80dp (approx 74% of 108dp)
        # to ensure it sits safely within the system squircle/circle mask
        $fgSize = [float]($aDim * 0.76)
        $fgOffset = [float](($aDim - $fgSize) / 2.0)
        $destRectA = New-Object System.Drawing.RectangleF $fgOffset, $fgOffset, $fgSize, $fgSize

        $srcRectA = New-Object System.Drawing.RectangleF 0, 0, $srcW, $srcH
        $gA.DrawImage($sourceImg, $destRectA, $srcRectA, [System.Drawing.GraphicsUnit]::Pixel)
        $gA.Dispose()

        $fgBmp.Save((Join-Path $targetFolder "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $fgBmp.Dispose()

        # --- B. LEGACY SQUARE ICON (ic_launcher.png) ---
        $lDim = [int]$cfg.Legacy
        $legBmp = New-Object System.Drawing.Bitmap $lDim, $lDim
        $gL = [System.Drawing.Graphics]::FromImage($legBmp)
        $gL.Clear([System.Drawing.Color]::Transparent)
        $gL.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gL.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gL.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gL.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $destRectL = New-Object System.Drawing.RectangleF 0, 0, $lDim, $lDim
        $gL.DrawImage($sourceImg, $destRectL, $srcRectA, [System.Drawing.GraphicsUnit]::Pixel)
        $gL.Dispose()

        $legBmp.Save((Join-Path $targetFolder "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $legBmp.Dispose()

        # --- C. LEGACY ROUND ICON (ic_launcher_round.png) ---
        $roundBmp = New-Object System.Drawing.Bitmap $lDim, $lDim
        $gR = [System.Drawing.Graphics]::FromImage($roundBmp)
        $gR.Clear([System.Drawing.Color]::Transparent)
        $gR.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gR.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gR.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $lDim, $lDim)
        $gR.SetClip($path)

        $gR.DrawImage($sourceImg, $destRectL, $srcRectA, [System.Drawing.GraphicsUnit]::Pixel)
        $gR.Dispose()
        $path.Dispose()

        $roundBmp.Save((Join-Path $targetFolder "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()
    }

    # 2. ADAPTIVE XML CONFIG (mipmap-anydpi-v26)
    $anydpiFolder = Join-Path $resDir "mipmap-anydpi-v26"
    if (-not (Test-Path $anydpiFolder)) {
        New-Item -ItemType Directory -Path $anydpiFolder -Force | Out-Null
    }

    $xmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/bg_dark" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"@
    Set-Content -Path (Join-Path $anydpiFolder "ic_launcher.xml") -Value $xmlContent -Encoding UTF8
    Set-Content -Path (Join-Path $anydpiFolder "ic_launcher_round.xml") -Value $xmlContent -Encoding UTF8

    # 3. SPLASH SCREEN LOGOS (drawable-*)
    $splashDensities = @{
        "drawable-mdpi"    = 192
        "drawable-hdpi"    = 288
        "drawable-xhdpi"   = 384
        "drawable-xxhdpi"  = 576
        "drawable-xxxhdpi" = 768
    }

    foreach ($folder in $splashDensities.Keys) {
        $dim = $splashDensities[$folder]
        $targetFolder = Join-Path $resDir $folder
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        }

        $sBmp = New-Object System.Drawing.Bitmap $dim, $dim
        $gS = [System.Drawing.Graphics]::FromImage($sBmp)
        $gS.Clear([System.Drawing.Color]::Transparent)
        $gS.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gS.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gS.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gS.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $destRectS = New-Object System.Drawing.RectangleF 0, 0, $dim, $dim
        $gS.DrawImage($sourceImg, $destRectS, (New-Object System.Drawing.RectangleF 0, 0, $srcW, $srcH), [System.Drawing.GraphicsUnit]::Pixel)
        $gS.Dispose()

        $sBmp.Save((Join-Path $targetFolder "splash_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $sBmp.Dispose()
    }

    # Also base drawable/splash_logo.png (512x512)
    $baseDrawable = Join-Path $resDir "drawable"
    $baseBmp = New-Object System.Drawing.Bitmap 512, 512
    $gB = [System.Drawing.Graphics]::FromImage($baseBmp)
    $gB.Clear([System.Drawing.Color]::Transparent)
    $gB.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gB.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gB.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gB.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gB.DrawImage($sourceImg, (New-Object System.Drawing.RectangleF 0, 0, 512, 512), (New-Object System.Drawing.RectangleF 0, 0, $srcW, $srcH), [System.Drawing.GraphicsUnit]::Pixel)
    $gB.Dispose()
    $baseBmp.Save((Join-Path $baseDrawable "splash_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $baseBmp.Dispose()

    Write-Host "Completed generation for $resDir"
}

Generate-All-New-Assets "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH_ANDROID\app\src\main\res"
if (Test-Path "C:\AutoCashAndroid\app\src\main\res") {
    Generate-All-New-Assets "C:\AutoCashAndroid\app\src\main\res"
}

$sourceImg.Dispose()
Write-Host "ALL BRAND ASSETS REGENERATED FROM MASTER LOGO!"
