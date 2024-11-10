import { OUTPUT_FOLDER_PATH } from '../common/index.js'

export const mapInputFileNameToOutputFileName = (inputFileName) => {
  return `${OUTPUT_FOLDER_PATH}/${inputFileName.replace('.bies', '.basm')}`
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
