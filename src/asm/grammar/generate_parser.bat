@echo off
pushd %~dp0
set JAVA_VERSION=jdk-21
set JAVA_HOME="C:\Program Files\Java\%JAVA_VERSION%"
set PATH=%JAVA_HOME%\bin;%PATH%
set ANTLR4_HOME=..\..\..\lib\antlr-4.13.1-complete.jar
set GRAMMAR=BiesC.g4
REM
rmdir /S /Q .antlr
java -jar %ANTLR4_HOME% -no-listener -visitor -o .antlr -Dlanguage=JavaScript %GRAMMAR%
pause