@echo off

echo PREREQ: "yarn install"


echo publish to openvsx ...
set /p OPENVSX_TOKEN= < %USERPROFILE%\.openvsx_token
echo %OPENVSX_TOKEN%
npx ovsx publish -p %OPENVSX_TOKEN%
