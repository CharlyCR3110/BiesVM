#!/usr/bin/env node

/**
 * This script serves as the entry point for the BiesCode compiler, which processes input files
 * and generates corresponding compiled output files. It includes error handling and supports
 * customizable output and error file options through CLI arguments.
 */
import fs from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { generateBasm } from './asm/generateBasm.js'
import { ERRORS_FOLDER_PATH, INPUT_FOLDER_PATH, OUTPUT_FOLDER_PATH } from './common/index.js'
import { mapInputFileNameToOutputFileName, prepareFolders, validateInputFilename } from './helpers/index.js'

prepareFolders()

const argv = yargs(hideBin(process.argv))
  .option('o', {
    alias: 'output',
    type: 'string',
    description: 'Nombre del archivo con el código compilado'
  })
  .option('e', {
    alias: 'errorfile',
    type: 'string',
    description: 'Nombre del archivo donde se guardarán los errores'
  })
  .demandCommand(1, 'Debes proporcionar el nombre del archivo de entrada.')
  .usage('Uso: biesc <inputfile> [options]')
  .help()
  .alias('h', 'help')
  .argv

const inputFilename = validateInputFilename(argv._[0])

// Obtener el nombre del archivo de salida (si no se especifica, se genera automáticamente)
const outputFilename = `${OUTPUT_FOLDER_PATH}/` + (argv.o || mapInputFileNameToOutputFileName(inputFilename))

// Nombre del archivo de errores (si no se especifica, los errores se muestran en consola)
const errorFilename = argv.e

try {
  const sourceCode = fs.readFileSync(`${INPUT_FOLDER_PATH}/${inputFilename}`, 'utf8')
  generateBasm(sourceCode, outputFilename)
  console.log(`Archivo procesado correctamente. Salida: ${outputFilename}`)
} catch (error) {
  const errorMessage = `Parece que hubo un error al procesar el archivo de entrada: \n${error.message}\n`
  if (errorFilename) {
    fs.writeFileSync(`${ERRORS_FOLDER_PATH}/${errorFilename}`, errorMessage)
    console.error(`Los errores se han guardado en: ${ERRORS_FOLDER_PATH}/${errorFilename}`)
  } else {
    console.error(errorMessage)
  }
}
