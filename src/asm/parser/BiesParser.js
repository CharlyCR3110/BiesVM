import antlr4 from 'antlr4'
import BiesVMLexer from '../grammar/.antlr/BiesVMLexer.js'
import BiesVMParser from '../grammar/.antlr/BiesVMParser.js'

/**
 * Parses the input code.
 * @param {*} input
 * @returns {Tree}
 * @throws {Error} - If there is a problem parsing the code.
 * @module asm/biesParser
 * @example
 * import { parse } from './asm/biesParser.js'
 */
export const parse = (input) => {
  const chars = new antlr4.InputStream(input)
  const lexer = new BiesVMLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)

  const parser = new BiesVMParser(tokens)

  // listen for errors
  parser.removeErrorListeners()
  parser.addErrorListener(new antlr4.error.ErrorListener())

  const tree = parser.program()

  return tree
}
