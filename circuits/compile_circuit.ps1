$ScriptPath = $PSScriptRoot
$circom = Get-Command "circom" -ErrorAction SilentlyContinue

# Locate Circom (Local in script dir, or Global)
if (Test-Path "$ScriptPath\circom.exe") {
    $circom = "$ScriptPath\circom.exe"
    Write-Host "Using Local Circom: $circom" -ForegroundColor Cyan
} elseif ($circom) {
    $circom = "circom"
    Write-Host "Using Global Circom..." -ForegroundColor Cyan
} else {
    Write-Error "Circom is not installed. Please install it from https://docs.circom.io or download 'circom-windows-amd64.exe' and place it in this folder as 'circom.exe'"
    exit 1
}

Write-Host "Compiling Circuit..." -ForegroundColor Green

# 1. Compile Circuit
# Change to script directory to ensure relative paths work
Push-Location $ScriptPath

if (Test-Path "build") { Remove-Item "build" -Recurse -Force }
mkdir -p build

try {
    & $circom game.circom --r1cs --wasm --sym -o build
} catch {
    Write-Error "Compilation Failed. Ensure circom is compatible."
    Pop-Location
    exit 1
}

# 2. Setup Groth16
Set-Location build

# Powers of Tau (Dummy setup for dev - NOT SECURE FOR PROD)
Write-Host "Generating Powers of Tau..."
# Use call operator & if snarkjs is a binary, or just invoke directly if in PATH (npm package)
# Windows requires .cmd extension if calling npm binaries in some contexts, but usually powershell handles it.
snarkjs powersoftau new bn128 12 pot12_0000.ptau
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First Contribution" -v

# Phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Setup Keys
Write-Host "Generating Keys..."
snarkjs groth16 setup game.r1cs pot12_final.ptau game_0000.zkey
snarkjs zkey contribute game_0000.zkey game_final.zkey --name="Second Contribution" -v

# Export Verification Key
snarkjs zkey export verificationkey game_final.zkey verification_key.json

# Cleanup
Pop-Location
Write-Host "DONE! Keys executed in $ScriptPath/build" -ForegroundColor Green
