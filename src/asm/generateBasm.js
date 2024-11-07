// generateBasm.js
import antlr4 from 'antlr4';
import BiesCLexer from '../asm/grammar/.antlr/BiesCLexer.js';
import BiesCParser from '../asm/grammar/.antlr/BiesCParser.js';
import BasmCodeGeneratorVisitor from './BasmCodeGeneratorVisitor.js';
import fs from 'fs';

function generateBasm(sourceCode, outputFilename = 'output.basm') {
  const chars = new antlr4.InputStream(sourceCode);
  const lexer = new BiesCLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new BiesCParser(tokens);
  parser.buildParseTrees = true;
  const tree = parser.program();

  const visitor = new BasmCodeGeneratorVisitor();
  visitor.visit(tree);

  visitor.writeToFile(outputFilename);
}

// Example usage:
// Read source code from a file
const sourceCode = fs.readFileSync('source.bies', 'utf8');
generateBasm(sourceCode, 'output.basm');
