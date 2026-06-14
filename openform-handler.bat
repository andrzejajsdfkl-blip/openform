@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: openform-handler.bat [path-to-file.off]
    pause
    exit /b
)

set "FILE_PATH=%~1"
echo Loading OpenForm file: !FILE_PATH!

if not exist "!FILE_PATH!" (
    echo Error: File does not exist.
    pause
    exit /b
)

:: Send file content to local Next.js API server using PowerShell, then launch browser with temporary token
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$content = Get-Content -Raw -Path '!FILE_PATH!' -Encoding UTF8;" ^
    "try {" ^
    "  $response = Invoke-RestMethod -Uri 'http://localhost:9002/api/import-local' -Method Post -Body $content -ContentType 'application/json';" ^
    "  if ($response.success) {" ^
    "    $url = 'http://localhost:9002/import?tempId=' + $response.id;" ^
    "    Start-Process $url;" ^
    "  } else {" ^
    "    Write-Host 'Error registering file: ' $response.error -ForegroundColor Red;" ^
    "    Read-Host 'Press Enter to exit';" ^
    "  }" ^
    "} catch {" ^
    "  Write-Host 'OpenForm Server is not running on http://localhost:9002.' -ForegroundColor Yellow;" ^
    "  Write-Host 'Please run: npm run dev' -ForegroundColor Cyan;" ^
    "  Write-Host $_.Exception.Message -ForegroundColor Red;" ^
    "  Read-Host 'Press Enter to exit';" ^
    "}"
