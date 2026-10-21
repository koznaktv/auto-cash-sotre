Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH\public\logo.png"
$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

# Source golden circle bounds: center = (281, 288.5), radius = 242.5
$srcCenterX = 281.0
$srcCenterY = 288.5
$srcRadius  = 242.5
$srcDiameter = $srcRadius * 2.0
$srcRect = New-Object System.Drawing.RectangleF ($srcCenterX - $srcRadius), ($srcCenterY - $srcRadius), $srcDiameter, $srcDiameter

function Generate-Icons-For-Project([string]$resDir) {
    $sizes = @{
        "mipmap-mdpi"    = @{ Legacy = 48;  Adaptive = 108; RadiusRatio = 0.78 }
        "mipmap-hdpi"    = @{ Legacy = 72;  Adaptive = 162; RadiusRatio = 0.78 }
        "mipmap-xhdpi"   = @{ Legacy = 96;  Adaptive = 216; RadiusRatio = 0.78 }
        "mipmap-xxhdpi"  = @{ Legacy = 144; Adaptive = 324; RadiusRatio = 0.78 }
        "mipmap-xxxhdpi" = @{ Legacy = 192; Adaptive = 432; RadiusRatio = 0.78 }
    }

    foreach ($folder in $sizes.Keys) {
        $cfg = $sizes[$folder]
        $targetFolder = Join-Path $resDir $folder
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        }

        # --- 1. ADAPTIVE FOREGROUND (ic_launcher_foreground.png) ---
        $aDim = [int]$cfg.Adaptive
        $fgBmp = New-Object System.Drawing.Bitmap($aDim, $aDim)
        $g = [System.Drawing.Graphics]::FromImage($fgBmp)
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # In adaptive icon (108dp canvas), circle diameter is aDim * RadiusRatio (~78%)
        $emblemSize = [float]($aDim * $cfg.RadiusRatio)
        $offset = [float](($aDim - $emblemSize) / 2.0)
        $destRect = New-Object System.Drawing.RectangleF $offset, $offset, $emblemSize, $emblemSize

        # Circular clip path so corners outside golden ring are 100% transparent!
        $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $clipPath.AddEllipse($destRect)
        $g.SetClip($clipPath)

        $g.DrawImage($sourceImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        $clipPath.Dispose()

        $fgBmp.Save((Join-Path $targetFolder "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $fgBmp.Dispose()

        # --- 2. LEGACY SQUARE / SQUIRCLE ICON (ic_launcher.png) ---
        $lDim = [int]$cfg.Legacy
        $legBmp = New-Object System.Drawing.Bitmap($lDim, $lDim)
        $gL = [System.Drawing.Graphics]::FromImage($legBmp)
        $gL.Clear([System.Drawing.Color]::Transparent)
        $gL.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gL.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gL.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gL.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Dark navy background fill matching brand #030c18
        $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 3, 12, 24))
        $gL.FillRectangle($bgBrush, 0, 0, $lDim, $lDim)

        # Draw emblem filling 96% of the legacy square with circular clip
        $lSize = [float]($lDim * 0.96)
        $lOffset = [float](($lDim - $lSize) / 2.0)
        $destRectL = New-Object System.Drawing.RectangleF $lOffset, $lOffset, $lSize, $lSize

        $clipPathL = New-Object System.Drawing.Drawing2D.GraphicsPath
        $clipPathL.AddEllipse($destRectL)
        $gL.SetClip($clipPathL)

        $gL.DrawImage($sourceImg, $destRectL, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $gL.Dispose()
        $clipPathL.Dispose()

        $legBmp.Save((Join-Path $targetFolder "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $legBmp.Dispose()

        # --- 3. LEGACY ROUND ICON (ic_launcher_round.png) ---
        $roundBmp = New-Object System.Drawing.Bitmap($lDim, $lDim)
        $gR = [System.Drawing.Graphics]::FromImage($roundBmp)
        $gR.Clear([System.Drawing.Color]::Transparent)
        $gR.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gR.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gR.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gR.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Circular clip path for clean antialiased round icon
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $lDim, $lDim)
        $gR.SetClip($path)
        $gR.FillRectangle($bgBrush, 0, 0, $lDim, $lDim)

        $destRectR = New-Object System.Drawing.RectangleF 0, 0, $lDim, $lDim
        $gR.DrawImage($sourceImg, $destRectR, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $gR.Dispose()
        $path.Dispose()

        $roundBmp.Save((Join-Path $targetFolder "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()
        $bgBrush.Dispose()
    }

    # --- 4. ADAPTIVE XML CONFIG (mipmap-anydpi-v26) ---
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
    Write-Host "Icons generated successfully in $resDir"
}

# Run for both android projects
Generate-Icons-For-Project "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH_ANDROID\app\src\main\res"
if (Test-Path "C:\AutoCashAndroid\app\src\main\res") {
    Generate-Icons-For-Project "C:\AutoCashAndroid\app\src\main\res"
}

$sourceImg.Dispose()
Write-Host "All icons generated with high precision and clean circular clip!"
