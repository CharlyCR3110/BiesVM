param (
    [string]$fileName
)

# Ruta completa del archivo de entrada y salida
$inputFile = $fileName
$outputFile = "$($fileName -replace '.bies$', '.biesASM')"
$outputFilePath = "output_files/$outputFile"

# 1. Ejecutar `npm run start` en BiesVM para procesar el archivo `.bies`
Write-Output "Ejecutando BiesVM para procesar $inputFile..."
npm run start $inputFile

# Verificar que el archivo de salida .biesASM se haya generado
if (!(Test-Path -Path $outputFilePath)) {
    Write-Output "Error: el archivo .biesASM no se generó en output_files."
    exit 1
}

# 2. Cambiar al directorio BiesEnv y ejecutar el comando de ejecución con node
Set-Location "../BiesEnv"
Write-Output "Ejecutando BiesEnv con el archivo $outputFile..."
node src/main.js --o output.txt --e error.txt --trace 1 "../BiesVM/$outputFilePath"

# Regresar al directorio original
Set-Location "../BiesVM"
Write-Output "Proceso completado."
