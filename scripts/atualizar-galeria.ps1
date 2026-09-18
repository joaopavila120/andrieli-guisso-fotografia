$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$imageRoot = Join-Path $projectRoot 'img'
$webRoot = Join-Path $imageRoot 'web'
$phrasesPath = Join-Path $projectRoot 'config\frases.json'
$catalogPath = Join-Path $projectRoot 'js\gallery-data.js'
$validExtensions = @('.jpg', '.jpeg', '.png')
$maxDimension = 2200.0
$jpegQuality = 86L

$categories = @('gestantes', 'newborn', 'retratos')

if (-not (Test-Path -LiteralPath $phrasesPath)) {
  throw "Arquivo de frases nao encontrado: $phrasesPath"
}

$contentConfig = Get-Content -LiteralPath $phrasesPath -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Path $webRoot -Force | Out-Null

function Get-StableIndex {
  param([string]$Value, [int]$Count)
  if ($Count -le 0) { return 0 }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value.ToLowerInvariant())
    $hash = $sha.ComputeHash($bytes)
    return [int]([BitConverter]::ToUInt32($hash, 0) % [uint32]$Count)
  }
  finally {
    $sha.Dispose()
  }
}

function Get-OutputName {
  param([string]$FileName)
  $stem = $FileName
  while ([IO.Path]::GetExtension($stem).ToLowerInvariant() -in $validExtensions) {
    $stem = [IO.Path]::GetFileNameWithoutExtension($stem)
  }
  $stem = [regex]::Replace($stem, '[^A-Za-z0-9._-]+', '-')
  $stem = $stem.Trim('-', '.')
  if ([string]::IsNullOrWhiteSpace($stem)) { $stem = 'foto' }
  return "$stem.jpg"
}

function Set-ExifOrientation {
  param([System.Drawing.Image]$Image)
  if ($Image.PropertyIdList -notcontains 274) { return }
  $orientation = $Image.GetPropertyItem(274).Value[0]
  switch ($orientation) {
    2 { $Image.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
    3 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
    4 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
    5 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
    6 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
    7 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
    8 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
  }
}

function Export-WebImage {
  param([IO.FileInfo]$Source, [string]$Destination)

  $sourceImage = [System.Drawing.Image]::FromFile($Source.FullName)
  try {
    Set-ExifOrientation -Image $sourceImage
    $scale = [Math]::Min(1.0, [Math]::Min($maxDimension / [double]$sourceImage.Width, $maxDimension / [double]$sourceImage.Height))
    $targetWidth = [int][Math]::Round($sourceImage.Width * $scale)
    $targetHeight = [int][Math]::Round($sourceImage.Height * $scale)
    $bitmap = [System.Drawing.Bitmap]::new($targetWidth, $targetHeight)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(245, 240, 232))
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $targetWidth, $targetHeight)
      }
      finally {
        $graphics.Dispose()
      }

      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
      $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
      try {
        $encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, $jpegQuality)
        $tempPath = "$Destination.tmp"
        $bitmap.Save($tempPath, $codec, $encoderParams)
        Move-Item -LiteralPath $tempPath -Destination $Destination -Force
      }
      finally {
        $encoderParams.Dispose()
      }
    }
    finally {
      $bitmap.Dispose()
    }
  }
  finally {
    $sourceImage.Dispose()
  }
}

$catalog = [ordered]@{ categories = [ordered]@{}; phrases = [ordered]@{} }

$totalCreated = 0
$totalRemoved = 0

foreach ($category in $categories) {
  $categoryConfig = $contentConfig.($category)
  $sourceDirectory = Join-Path $imageRoot $category
  $outputDirectory = Join-Path $webRoot $category
  New-Item -ItemType Directory -Path $sourceDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

  $sourceFiles = @(Get-ChildItem -LiteralPath $sourceDirectory -File | Where-Object { $_.Extension.ToLowerInvariant() -in $validExtensions } | Sort-Object @{Expression='LastWriteTimeUtc';Descending=$true}, Name)
  $expectedOutput = @{}
  $items = @()
  $categoryPhrases = @($categoryConfig.phrases)
  $catalog.phrases[$category] = $categoryPhrases
  $categoryTitles = @($categoryConfig.titles)

  foreach ($file in $sourceFiles) {
    $outputName = Get-OutputName -FileName $file.Name
    if ($expectedOutput.ContainsKey($outputName)) {
      throw "Dois arquivos da pasta '$category' geram o mesmo nome '$outputName'. Renomeie um deles."
    }
    $expectedOutput[$outputName] = $true
    $destination = Join-Path $outputDirectory $outputName

    if (-not (Test-Path -LiteralPath $destination) -or $file.LastWriteTimeUtc -gt (Get-Item -LiteralPath $destination).LastWriteTimeUtc) {
      Export-WebImage -Source $file -Destination $destination
      (Get-Item -LiteralPath $destination).LastWriteTimeUtc = $file.LastWriteTimeUtc
      $totalCreated++
      Write-Host "Otimizada: $category/$($file.Name)" -ForegroundColor DarkGray
    }

    $webImage = [System.Drawing.Image]::FromFile($destination)
    try {
      $orientation = if ($webImage.Width -gt $webImage.Height) { 'landscape' } else { 'portrait' }
      $width = $webImage.Width
      $height = $webImage.Height
    }
    finally {
      $webImage.Dispose()
    }

    $stableIndex = Get-StableIndex -Value "$category/$($file.Name)" -Count $categoryPhrases.Count
    $titleIndex = Get-StableIndex -Value "titulo/$category/$($file.Name)" -Count $categoryTitles.Count
    $encodedName = [Uri]::EscapeDataString($outputName)
    $items += [ordered]@{
      src = "img/web/$category/$encodedName"
      file = $file.Name
      category = $category
      label = $categoryConfig.label
      title = $categoryTitles[$titleIndex]
      phrase = $categoryPhrases[$stableIndex]
      alt = "$($categoryConfig.alt) por Andrieli Guisso Fotografia"
      orientation = $orientation
      width = $width
      height = $height
    }
  }

  foreach ($oldFile in Get-ChildItem -LiteralPath $outputDirectory -File -Filter '*.jpg') {
    if (-not $expectedOutput.ContainsKey($oldFile.Name)) {
      Remove-Item -LiteralPath $oldFile.FullName -Force
      $totalRemoved++
      Write-Host "Removida do site: $category/$($oldFile.Name)" -ForegroundColor DarkGray
    }
  }

  $catalog.categories[$category] = @($items)
  Write-Host "$($categoryConfig.label): $($items.Count) foto(s)" -ForegroundColor Cyan
}

$json = $catalog | ConvertTo-Json -Depth 8
$javascript = "window.GALLERY_DATA = $json;`n"
[IO.File]::WriteAllText($catalogPath, $javascript, [Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host "Catalogo atualizado: $catalogPath" -ForegroundColor Green
Write-Host "Novas/alteradas: $totalCreated | Removidas: $totalRemoved" -ForegroundColor Green
