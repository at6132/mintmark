@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Mintmark Railway deploy

if not "%~1"=="" (
  set "TARGET=%~1"
  goto run
)

echo.
echo   Mintmark  Railway deploy
echo   Uploads from this computer. Does not use GitHub.
echo.
echo     1.  Backend API
echo     2.  Print worker
echo     3.  Frontend website
echo     4.  All three
echo.
set /p CHOICE=  Type 1, 2, 3, or 4 and press Enter: 

if "%CHOICE%"=="1" set "TARGET=backend" & goto run
if "%CHOICE%"=="2" set "TARGET=worker" & goto run
if "%CHOICE%"=="3" set "TARGET=frontend" & goto run
if "%CHOICE%"=="4" set "TARGET=all" & goto run

echo.
echo   That was not 1-4. Nothing was deployed.
goto end

:run
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %TARGET%
if errorlevel 1 (
  echo.
  echo   Deploy failed. Scroll up for the error.
) else (
  echo.
  echo   Deploy finished.
)

:end
echo.
pause
exit /b %ERRORLEVEL%
