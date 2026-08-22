Add-Type -AssemblyName System.Drawing

$mobileResDir = "c:\Users\Tower Computers\Downloads\benchmark\benchmark-justice\mobile\android\app\src\main\res"
$sourceLogoPath = "c:\Users\Tower Computers\Downloads\benchmark\benchmark-justice\mobile\assets\images\benchmark_justice_logo.png"

if (-not (Test-Path $sourceLogoPath)) {
    $sourceLogoPath = "c:\Users\Tower Computers\Downloads\benchmark\benchmark-justice\frontend\public\images\benchmark_justice_logo.png"
}

Write-Output "Using source logo: $sourceLogoPath"
$srcImg = [System.Drawing.Image]::FromFile($sourceLogoPath)
Write-Output "Source Dimensions: $($srcImg.Width) x $($srcImg.Height)"

# Densities and their icon size / foreground size
# mdpi:    48x48 icon, 108x108 fg
# hdpi:    72x72 icon, 162x162 fg
# xhdpi:   96x96 icon, 216x216 fg
# xxhdpi:  144x144 icon, 324x324 fg
# xxxhdpi: 192x192 icon, 432x432 fg

$densities = @(
    @{ name = "mipmap-mdpi";    iconSize = 48;  fgSize = 108 },
    @{ name = "mipmap-hdpi";    iconSize = 72;  fgSize = 162 },
    @{ name = "mipmap-xhdpi";   iconSize = 96;  fgSize = 216 },
    @{ name = "mipmap-xxhdpi";  iconSize = 144; fgSize = 324 },
    @{ name = "mipmap-xxxhdpi"; iconSize = 192; fgSize = 432 }
)

$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#050B14")

function Create-Scaled-Image($canvasSize, $scaleFactor, $fillBackground, $isRound) {
    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($fillBackground) {
        if ($isRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $brush = New-Object System.Drawing.SolidBrush($bgColor)
            $g.FillEllipse($brush, 0, 0, $canvasSize, $canvasSize)
            $brush.Dispose()
        } else {
            $g.Clear($bgColor)
        }
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Calculate target dimensions for source logo within the safe zone
    # Safe zone scaleFactor: e.g. 0.60 (60% of canvas)
    $targetMaxDim = [int]($canvasSize * $scaleFactor)
    
    $srcRatio = $srcImg.Width / $srcImg.Height
    if ($srcRatio -gt 1) {
        # Wider than tall
        $targetW = $targetMaxDim
        $targetH = [int]($targetW / $srcRatio)
    } else {
        # Taller than wide
        $targetH = $targetMaxDim
        $targetW = [int]($targetH * $srcRatio)
    }

    $targetX = [int](($canvasSize - $targetW) / 2)
    $targetY = [int](($canvasSize - $targetH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($targetX, $targetY, $targetW, $targetH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $srcImg.Width, $srcImg.Height)
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    return $bmp
}

foreach ($d in $densities) {
    $dir = Join-Path $mobileResDir $d.name
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # 1. ic_launcher.png (legacy full icon with background, scale 0.72)
    $iconBmp = Create-Scaled-Image $d.iconSize 0.72 $true $false
    $iconPath = Join-Path $dir "ic_launcher.png"
    $iconBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()

    # 2. ic_launcher_round.png (legacy round icon with circular background, scale 0.70)
    $roundBmp = Create-Scaled-Image $d.iconSize 0.70 $true $true
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    $roundBmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundBmp.Dispose()

    # 3. ic_launcher_foreground.png (adaptive foreground, safe-zone scale 0.58 so it never clips!)
    $fgBmp = Create-Scaled-Image $d.fgSize 0.58 $false $false
    $fgPath = Join-Path $dir "ic_launcher_foreground.png"
    $fgBmp.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()

    Write-Output "Generated icons for $($d.name)"
}

$srcImg.Dispose()
Write-Output "All launcher icons successfully generated and saved!"
