import fs from 'fs'
import { generateBasm } from './asm/generateBasm.js'
import { INPUT_FOLDER_PATH } from './common/index.js'
import { mapInputFileNameToOutputFileName, validateInputFilename } from './helpers/index.js'

const inputFilename = validateInputFilename(process.argv[2])

try {
  const sourceCode = fs.readFileSync(`${INPUT_FOLDER_PATH}/${inputFilename}`, 'utf8')
  const outputFilename = mapInputFileNameToOutputFileName(inputFilename)
  generateBasm(sourceCode, outputFilename)
} catch (error) {
  console.error('Parece que hubo un error al leer el archivo de entrada.')
  console.error('Asegúrate de que el archivo exista y esté en la carpeta `input_files`')
}
