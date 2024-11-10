import { OUTPUT_FOLDER_PATH } from '../common/index.js'

export const mapInputFileNameToOutputFileName = (inputFileName) => {
  return `${OUTPUT_FOLDER_PATH}/${inputFileName.replace('.bies', '.basm')}`
}
