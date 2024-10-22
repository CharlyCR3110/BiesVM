import { parse } from './src/asm/biesParser.js'
import { TreePrintVisitor } from './src/asm/TreePrintVisitor.js'

// test code

const input = `
  let const x = 1
  in {
    const y = 20
    fun sum(a, b) => a + b
    sum(x, y) // Llamada a la función sum con los valores de x e y
  }
`

const tree = parse(input)
const visitor = new TreePrintVisitor()

visitor.visit(tree)
