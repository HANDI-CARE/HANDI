@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Usage: build_and_push.bat [TAG] [DOCKER_USER]
REM Defaults: TAG=latest, DOCKER_USER=qudcks8084

set TAG=%1
if "%TAG%"=="" set TAG=latest

set DOCKER_USER=%2
if "%DOCKER_USER%"=="" set DOCKER_USER=kyngmn

set LOCAL_IMAGE=handi-pharmguard:%TAG%
set REMOTE_IMAGE=%DOCKER_USER%/handi-pharmguard:%TAG%

echo Building %LOCAL_IMAGE%
docker build -t %LOCAL_IMAGE% -f Dockerfile . || goto :error

echo Tagging %LOCAL_IMAGE% -> %REMOTE_IMAGE%
docker tag %LOCAL_IMAGE% %REMOTE_IMAGE% || goto :error

echo Pushing %REMOTE_IMAGE%
docker push %REMOTE_IMAGE% || goto :error

echo Done: %REMOTE_IMAGE%
exit /b 0

:error
echo Build/Push failed with error code %ERRORLEVEL%
exit /b %ERRORLEVEL%


