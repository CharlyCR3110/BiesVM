/**
 * Generates a .basm file by parsing source code and using a visitor pattern for code generation.
 *
 * @param sourceCode - The source code to be parsed and compiled.
 * @param outputFilename - The name of the output file to save the generated .basm content.
 */
import BiesCodeGeneratorVisitor from './BiesCodeGeneratorVisitor.js'
import { parse } from './biesParser.js'

export const generateBasm = (sourceCode, outputFilename) => {
  const tree = parse(sourceCode)

  const visitor = new BiesCodeGeneratorVisitor()
  visitor.visit(tree)
  visitor.writeToFile(outputFilename)
}
