#!/usr/bin/env node

/**
 * This script automates the process of compiling multiple `.bies` source files from the input folder.
 * It reads all `.bies` files in the input directory, attempts to compile them, and logs the success or failure 
 * of each compilation. If an error occurs, it writes the error details to a specified error file.
 */
import fs from 'fs'
import { execSync } from 'child_process'
import { mapInputFileNameToErrorFileName, mapInputFileNameToOutputFileName, prepareFolders } from '../src/helpers/index.js'
import { INPUT_FOLDER_PATH } from '../src/common/index.js'

// Prepare necessary folders (e.g., input, output, error folders)
prepareFolders()

// Define the input folder where source files are located
const inputFolder = `./${INPUT_FOLDER_PATH}`

// Read and filter all files in the input folder to find those with a '.bies' extension
const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.bies'))

// If no '.bies' files are found, notify the user and exit the process
if (files.length === 0) {
  console.log('No se encontraron archivos .bies en la carpeta de entrada.')
  process.exit(0)
}

// Log the number of files found for compilation
console.log(`Encontrados ${files.length} archivos para probar.\n`)

// Iterate through each `.bies` file and attempt to compile it
files.forEach(file => {
  // Construct file paths for the input, output, and error files
  const inputFilePath = `${file}`
  const outputFilePath = `${mapInputFileNameToOutputFileName(file)}`
  const errorFilePath = `${mapInputFileNameToErrorFileName(file)}`

  try {
    // Build the command to compile the `.bies` file with the specified output and error files
    const compileCommand = `biesc ${inputFilePath} --o ${outputFilePath} --e ${errorFilePath}`

    // Execute the compile command and inherit the output to the console
    execSync(compileCommand, { stdio: 'inherit' })

    // Notify the user of successful compilation attempt
    console.log(`✨ ${file} se ha intentado compilar exitosamente. En caso de errores, revisa el archivo de errores.\n`)
  } catch (error) {
    console.error(`❌ Error al compilar ${file}. Ver detalles en: ${errorFilePath}\n`)
  }
})

console.log('Pruebas completadas.')
