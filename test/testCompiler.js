#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'
import { mapInputFileNameToErrorFileName, mapInputFileNameToOutputFileName } from '../src/helpers/index.js'
import { INPUT_FOLDER_PATH, OUTPUT_FOLDER_PATH, ERRORS_FOLDER_PATH } from '../src/common/index.js'
// Rutas de entrada y salida
const inputFolder = `./${INPUT_FOLDER_PATH}`
const outputFolder = `./${OUTPUT_FOLDER_PATH}`
const errorFolder = `./${ERRORS_FOLDER_PATH}`

if (!fs.existsSync(inputFolder)) {
  console.error(`Error: No se encontró la carpeta de entrada: ${inputFolder}`)
  process.exit(1)
}
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder)
}
if (!fs.existsSync(errorFolder)) {
  fs.mkdirSync(errorFolder)
}

const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.bies'))

if (files.length === 0) {
  console.log('No se encontraron archivos .bies en la carpeta de entrada.')
  process.exit(0)
}

console.log(`Encontrados ${files.length} archivos para probar.\n`)

files.forEach(file => {
  const inputFilePath = `${file}`
  const outputFilePath = `${mapInputFileNameToOutputFileName(file)}`
  const errorFilePath = `${mapInputFileNameToErrorFileName(file)}`

  try {
    const compileCommand = `biesc ${inputFilePath} --o ${outputFilePath} --e ${errorFilePath}`
    console.log(`command: ${compileCommand}...`)

    execSync(compileCommand, { stdio: 'inherit' })

    console.log(`✅ ${file} se ha intentado compilar exitosamente. En caso de errores, revisa el archivo de errores.\n`)
  } catch (error) {
    console.error(`❌ Error al compilar ${file}. Ver detalles en: ${errorFilePath}\n`)
  }
})

console.log('Pruebas completadas.')
