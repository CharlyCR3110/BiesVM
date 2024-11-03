import antlr4 from 'antlr4'
import BiesCLexer from './grammar/.antlr/BiesCLexer.js'
import BiesCParser from './grammar/.antlr/BiesCParser.js'

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
  const lexer = new BiesCLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)

  const parser = new BiesCParser(tokens)

  // listen for errors
  parser.removeErrorListeners()
  parser.addErrorListener(new antlr4.error.ErrorListener())

  const tree = parser.program()

  return tree
}
