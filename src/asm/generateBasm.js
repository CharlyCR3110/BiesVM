import BiesCodeGeneratorVisitor from './BiesCodeGeneratorVisitor.js'
import { parse } from './biesParser.js'

export const generateBasm = (sourceCode, outputFilename) => {
  const tree = parse(sourceCode)

  const visitor = new BiesCodeGeneratorVisitor()
  visitor.visit(tree)
  visitor.writeToFile(outputFilename)
}
