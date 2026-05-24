$rootFolders = @(
    "assets",
    "components",
    "config",
    "constants",
    "contexts",
    "features",
    "layouts",
    "pages",
    "router",
    "store"
)

$features = @(
    "auth",
    "booking",
    "social",
    "tour",
    "voucher"
)

$subFolders = @(
    "pages",
    "components",
    "hooks",
    "services",
    "store",
    "types",
    "utils"
)

# Create root folders
foreach ($folder in $rootFolders) {

    New-Item -ItemType Directory -Force -Path $folder | Out-Null

    New-Item `
        -ItemType File `
        -Force `
        -Path "$folder/.gitkeep" | Out-Null
}

# Create feature folders
foreach ($feature in $features) {

    foreach ($folder in $subFolders) {

        $path = "features/$feature/$folder"

        New-Item -ItemType Directory -Force -Path $path | Out-Null

        New-Item `
            -ItemType File `
            -Force `
            -Path "$path/.gitkeep" | Out-Null
    }
}

Write-Host "Frontend structure created successfully!" -ForegroundColor Green