import { OUTPUT_FILE_EXTENSION } from '../common/index.js'

export const mapInputFileNameToOutputFileName = (inputFileName) => {
  return `${inputFileName.replace('.bies', OUTPUT_FILE_EXTENSION)}`
}

export const mapInputFileNameToErrorFileName = (inputFileName) => {
  return `${inputFileName.replace('.bies', '.log')}`
}

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
