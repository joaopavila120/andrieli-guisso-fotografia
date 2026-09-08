@echo off
setlocal
cd /d "%~dp0"

echo Atualizando e otimizando a galeria...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\atualizar-galeria.ps1"
if errorlevel 1 (
  echo.
  echo Nao foi possivel atualizar as fotos. Leia o erro acima.
  pause
  exit /b 1
)

echo.
set /p PUBLICAR=Deseja publicar esta atualizacao no GitHub agora? (S/N):
if /I not "%PUBLICAR%"=="S" (
  echo Fotos preparadas. Voce pode publicar mais tarde.
  pause
  exit /b 0
)

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Nao ha alteracoes novas para publicar.
  pause
  exit /b 0
)

git commit -m "Atualiza galeria de fotos"
if errorlevel 1 (
  echo Nao foi possivel criar o commit.
  pause
  exit /b 1
)

git push origin main
if errorlevel 1 (
  echo O commit foi criado, mas o envio falhou. Verifique sua conexao.
  pause
  exit /b 1
)

echo.
echo Site atualizado e enviado com sucesso.
pause
