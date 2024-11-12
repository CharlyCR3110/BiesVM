import antlr4 from 'antlr4' // Importa el módulo antlr4
import BiesVMParser from '../src/asm/grammar/.antlr/BiesCParser.js'
import BiesVMLexer from '../src/asm/grammar/.antlr/BiesCLexer.js'
import BiesCodeGeneratorVisitor from '../src/asm/BiesCodeGeneratorVisitor.js'
import { parse } from '../src/asm/biesParser.js'

function testVisitor (input) {
  //
  const tree = parse(input)

  const visitor = new BiesCodeGeneratorVisitor()
  visitor.visit(tree) // Visita el árbol de análisis

  console.log('Resultados de factsGenerator:')
  for (const fact of visitor.factsGenerator()) {
    console.log(fact) // Imprimimos cada hecho generado
  }
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

const inputProgram02 = `
let splash = (msg) => print(msg)
let version = 666 - 664
splash("Testing helloworld Version " + version + "***")
print("Hello World!") 
`

const inputProgram03 = `
// Version compleja 3
let splash = (msg) => print(msg)
let greetings = () => "Hello World!"
let version = (4 + 1 - 2)
splash("Testing helloworld Version " + version + " ***")
print(greetings()) 
`

const inputProgram04 = `
// Version compleja 4 let-in
let {
	 const splash = (msg) => print(msg)
	 const greetings = () => "Hello World!"
	} in {
    let version = 4 * 4 / (3 + 1)
		splash("Testing helloworld Version " + version + " ***")
		print(greetings()) 
	}
`

const inputProgram05 = `
// Version compleja 5 let-in
let {
		const splash = (msg) => print(msg)
		const greetings = () => 
		      let {const greet = input("Enter greeting>") 
			  } in 
			  if (len(greet) == 0 ) then "Hello World!" else greet
	} in {
	    let version = 5 ** 2 / (4 + 1)
		splash("Testing helloworld Version " + version + " ***")
		print(greetings())
    }		
`

const inputProgram06 = `
// Version Extra compleja 6 Maximo entre dos números, lambda binaria
let max = (x, y) => if (x > y) then x else y
let {
	const x = 10
	const y = 20
} in {
	print("*** Testing max("+ x + " ," + y + ") ***")
	print(max(x, y))
}
`
const inputProgram07 = `
// Version Extra compleja 7 Maximo entre dos números, lambda anidada
let max = x => y => if (x > y) then x else y
let {
	const x = 10
	const y = 20
} in {
	print("*** Testing max("+ x + " ," + y + ") ***")
	//  print(max(x)(y))
}
`

const inputProgram08 = `
// Version Extra compleja 8 Acceso a un elemento de una lista
let {const a = [1, 2, 3, "Hello World!", 5, 6, 7]
	} in {
	print("*** Testing List Access ("+ a + ") ***")
	print(a[ a[0] + 2 ])
}
`

const inputProgram09 = `
// Version Extra compleja 9 Largo de una lista (iterativo) lambda multi_argumento. Lambda derivada
let sumList = (a, from, to, s) => if (from == to) then s else sumList(a, from + 1, to, a[from] + s)
let sumListShort = (a, n) => sumList(a, 0, n, 0)
let {const a = [1, 2, 3, 4, 5]
	 const from = 0
	 const to = 3 
	} in {
	print("*** Testing sumList("+ a + " ," + from + ", " + to + ") ***")
	print(sumList(a, from, to, 0) )
	print(sumListShort(a, to))
}
`

try {
  console.log('Testing visitor...')

  console.log('----'.repeat(10))
  testVisitor(inputProgram00)
  console.log('----'.repeat(10))
  // testVisitor(inputProgram01)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram02)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram03)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram04)
  // console.log('----'.repeat(10))
  // //testVisitor(inputProgram05)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram06)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram07)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram08)
  // console.log('----'.repeat(10))
  // testVisitor(inputProgram09)
} catch (e) {
  console.error(e)
}
