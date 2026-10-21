Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH\public\logo.png"
$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

# Source is now 512x512 centered!
$srcW = $sourceImg.Width
$srcH = $sourceImg.Height

function Generate-Splash-Logo([string]$resDir) {
    $densities = @{
        "drawable-mdpi"    = 192
        "drawable-hdpi"    = 288
        "drawable-xhdpi"   = 384
        "drawable-xxhdpi"  = 576
        "drawable-xxxhdpi" = 768
    }

    # Also default drawable folder
    $drawableBase = Join-Path $resDir "drawable"
    if (-not (Test-Path $drawableBase)) {
        New-Item -ItemType Directory -Path $drawableBase -Force | Out-Null
    }

    foreach ($folder in $densities.Keys) {
        $dim = $densities[$folder]
        $targetFolder = Join-Path $resDir $folder
        if (-not (Test-Path $targetFolder)) {
            New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        }

        $bmp = New-Object System.Drawing.Bitmap $dim, $dim
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Golden emblem fills 92% of the canvas with smooth circular clip
        $emblemSize = [float]($dim * 0.92)
        $offset = [float](($dim - $emblemSize) / 2.0)
        $destRect = New-Object System.Drawing.RectangleF $offset, $offset, $emblemSize, $emblemSize

        $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $clipPath.AddEllipse($destRect)
        $g.SetClip($clipPath)

        $srcRect = New-Object System.Drawing.RectangleF 0, 0, $srcW, $srcH
        $g.DrawImage($sourceImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

        $g.Dispose()
        $clipPath.Dispose()

        $outputPath = Join-Path $targetFolder "splash_logo.png"
        $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    }

    # Also save master in drawable/splash_logo.png (512x512)
    $masterBmp = New-Object System.Drawing.Bitmap 512, 512
    $gM = [System.Drawing.Graphics]::FromImage($masterBmp)
    $gM.Clear([System.Drawing.Color]::Transparent)
    $gM.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gM.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gM.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $destRectM = New-Object System.Drawing.RectangleF 20, 20, 472, 472
    $clipPathM = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPathM.AddEllipse($destRectM)
    $gM.SetClip($clipPathM)
    $gM.DrawImage($sourceImg, $destRectM, (New-Object System.Drawing.RectangleF 0, 0, $srcW, $srcH), [System.Drawing.GraphicsUnit]::Pixel)
    $gM.Dispose()
    $clipPathM.Dispose()
    $masterBmp.Save((Join-Path $drawableBase "splash_logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $masterBmp.Dispose()

    Write-Host "Splash logos created in $resDir"
}

Generate-Splash-Logo "C:\Users\IRFAN\OneDrive\Desktop\auto cash يىڭى\AUTO_CASH_ANDROID\app\src\main\res"
if (Test-Path "C:\AutoCashAndroid\app\src\main\res") {
    Generate-Splash-Logo "C:\AutoCashAndroid\app\src\main\res"
}

$sourceImg.Dispose()
Write-Host "All splash logos generated successfully!"
