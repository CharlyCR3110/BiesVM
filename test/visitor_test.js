import antlr4 from 'antlr4' // Importa el módulo antlr4
import BiesVMParser from '../src/asm/grammar/.antlr/BiesCParser.js'
import BiesVMLexer from '../src/asm/grammar/.antlr/BiesCLexer.js'
import BiesCodeGeneratorVisitor from '../src/asm/BiesCodeGeneratorVisitor.js'

function testVisitor (input) {
  const chars = new antlr4.InputStream(input)
  const lexer = new BiesVMLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new BiesVMParser(tokens)

  // Analizar el input
  const tree = parser.program() // Asumiendo que 'program' es la regla raíz de tu gramática

  const visitor = new BiesCodeGeneratorVisitor()
  const result = visitor.visit(tree) // Visita el árbol de análisis

  console.log('Resultado de la visita al árbol:')
  console.log(result) // Imprime el resultado
}

// Ejemplo de entrada para probar
const inputProgram00 = `
// Version compleja 0
print("Testing helloworld Version 0 ***")
print("Hello World!") 
`

const inputProgram01 = `
// Version compleja 1
let splash = () => print("Testing helloworld Version 1 ***")
splash()
print("Hello World!") 
`

// fix: no concantena el valor de `version` en el string
const inputProgram02 = `
let splash = (msg) => print(msg)
let version = 666 - 664
splash("Testing helloworld Version " + version + "***")
print("Hello World!") 
`

// not tested yet
const inputProgram03 = `
// Version compleja 3
let splash = (msg) => print(msg)
let greetings = () => "Hello World!"
let version = (4 + 1 - 2)
splash("Testing helloworld Version " + version + " ***")
print(greetings()) 
`
try {
  console.log('Testing visitor...')

  console.log('----'.repeat(10))
  testVisitor(inputProgram00)
  console.log('----'.repeat(10))
  testVisitor(inputProgram01)
  console.log('----'.repeat(10))
  testVisitor(inputProgram02)
  console.log('----'.repeat(10))
} catch (e) {
  console.error(e)
}
