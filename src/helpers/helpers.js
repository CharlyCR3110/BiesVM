import fs from 'fs'
import { ERRORS_FOLDER_PATH, INPUT_FOLDER_PATH, OUTPUT_FILE_EXTENSION, OUTPUT_FOLDER_PATH } from '../common/index.js'

/**
 * Maps the input filename to the output filename.
 * @param {string} inputFileName
 * @returns {string} The output filename.
 * @example
 * mapInputFileNameToOutputFileName('program.bies') // program.asm
 */
export const mapInputFileNameToOutputFileName = (inputFileName) => {
  return `${inputFileName.replace('.bies', OUTPUT_FILE_EXTENSION)}`
}

/**
 * Maps the input filename to the error filename.
 * @param {string} inputFileName
 * @returns {string} The error filename.
 * @example
 * mapInputFileNameToErrorFileName('program.bies') // program.log
 */
export const mapInputFileNameToErrorFileName = (inputFileName) => {
  return `${inputFileName.replace('.bies', '.log')}`
}

/**
 * Validates the input filename.
 * @param {string} inputFilename
 * @returns {string} The input filename if it is valid.
 */
export const validateInputFilename = (inputFilename) => {
  if (!inputFilename) {
    console.error('Por favor, proporciona el nombre del archivo como argumento.')
    console.info('Asegúrate de que el archivo esté en la carpeta `input_files`')
    console.info('Ejemplo: `npm start program.bies`')
    process.exit(1)
  }

  if (!inputFilename.endsWith('.bies')) {
    console.error('El archivo debe tener la extensión `.bies`')
    process.exit(1)
  }

  return inputFilename
}

/**
 * Prepares the necessary folders for the application.
 * Ensures input, output, and error folders exist, creating them if necessary.
 */
export const prepareFolders = () => {
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
}
