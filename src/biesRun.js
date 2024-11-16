#!/usr/bin/env node

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { mapInputFileNameToOutputFileName, validateInputFilename } from './helpers/index.js'
import { BIES_ENV_PATH, BIES_VM_OUTPUT_FILES_PATH_FROM_BIES_ENV, BIES_VM_PATH, ERRORS_FOLDER_PATH, INPUT_FOLDER_PATH, OUTPUT_FOLDER_PATH, RUN_COMMAND } from './common/index.js'

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

const biesVMPath = path.resolve(BIES_VM_PATH)
const biesEnvPath = path.resolve(BIES_ENV_PATH)

// Parsear argumentos
const argv = yargs(hideBin(process.argv))
  .usage('Uso: biesRun <inputfile> [options]')
  .option('o', {
    alias: 'output',
    type: 'string',
    description: 'Nombre del archivo con el código compilado'
  })
  .option('e', {
    alias: 'errorfile',
    type: 'string',
    description: 'Archivo para guardar errores de compilación'
  })
  .demandCommand(1, 'Debes proporcionar el nombre del archivo de entrada.')
  .help()
  .alias('h', 'help')
  .argv

const inputFilename = validateInputFilename(argv._[0])

const outputFilename = argv.o || mapInputFileNameToOutputFileName(inputFilename)
const errorFilename = argv.e

if (!fs.existsSync(biesVMPath)) {
  console.error(`Error: No se encontró el directorio de compilación: ${biesVMPath}`)
  process.exit(1)
}
if (!fs.existsSync(biesEnvPath)) {
  console.error(`Error: No se encontró el directorio de ejecución: ${biesEnvPath}`)
  process.exit(1)
}

try {
  console.log('Compilando el archivo...')
  const compileCommand = `${RUN_COMMAND} ${inputFilename} --o ${outputFilename} ${errorFilename ? `--e ${errorFilename}` : ''}`
  execSync(compileCommand, { stdio: 'inherit' })
  console.log('Compilación exitosa.')
} catch (error) {
  console.error('Error durante la compilación.')
  process.exit(1)
}

try {
  console.log('Ejecutando el archivo compilado...')

  const fileToRunPath = `${BIES_VM_OUTPUT_FILES_PATH_FROM_BIES_ENV}\\${outputFilename}`
  const runCommand = `${RUN_COMMAND} --o output.txt --e error.txt --trace 1 ${fileToRunPath}`
  execSync(runCommand, { cwd: biesEnvPath, stdio: 'inherit' }) // Cambiar al path de BiesEnv para ejecutar el archivo
  console.log('Ejecución completada.')
} catch (error) {
  console.error('Error durante la ejecución.')
  process.exit(1)
}
