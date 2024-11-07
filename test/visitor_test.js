import BiesCodeGeneratorVisitor from '../src/asm/BiesCodeGeneratorVisitor.js'
import { parse } from '../src/asm/biesParser.js'

function * testVisitorGenerator (input, description) {
  console.log(`\n==== Running Test: ${description} ====\n`)

  const syntaxTree = parse(input)
  const visitor = new BiesCodeGeneratorVisitor()

  yield { type: 'Visit Result', result: visitor.visit(syntaxTree) }

  for (const fact of visitor.factsGenerator()) {
    yield { type: 'Generated Fact', fact }
  }
}

function * runAllTestsGenerator () {
  const testInputs = [
    {
      description: 'Complex Version 0',
      code: `// Version compleja 0
print("Testing helloworld Version 0 ***")
print("Hello World!")`
    },
    {
      description: 'Complex Version 1',
      code: `// Version compleja 1
let splash = () => print("Testing helloworld Version 1 ***")
splash()
print("Hello World!")`
    },
    {
      description: 'Complex Version 2',
      code: `let splash = (msg) => print(msg)
let version = 666 - 664
splash("Testing helloworld Version " + version + "***")
print("Hello World!")`
    },
    {
      description: 'Complex Version 3',
      code: `// Version compleja 3
let splash = (msg) => print(msg)
let greetings = () => "Hello World!"
let version = (4 + 1 - 2)
splash("Testing helloworld Version " + version + " ***")
print(greetings())`
    },
    {
      description: 'Complex Version 4 with let-in',
      code: `// Version compleja 4 let-in
let {
  const splash = (msg) => print(msg)
  const greetings = () => "Hello World!"
} in {
  let version = 4 * 4 / (3 + 1)
  splash("Testing helloworld Version " + version + " ***")
  print(greetings())
}`
    },
    {
      description: 'Extra Complex Version 6 with Max Function',
      code: `// Version Extra compleja 6 Maximo entre dos números, lambda binaria
let max = (x, y) => if (x > y) then x else y
let {
  const x = 10
  const y = 20
} in {
  print("*** Testing max("+ x + " ," + y + ") ***")
  print(max(x, y))
}`
    },
    {
      description: 'Extra Complex Version 7 with Nested Lambda Max Function',
      code: `// Version Extra compleja 7 Maximo entre dos números, lambda anidada
    let max = x => y => if (x > y) then x else y
    let {
      const x = 10
      const y = 20
    } in {
      print("*** Testing max("+ x + " ," + y + ") ***")
      print(max(x)(y))
    }`
    }
  ]
  for (const testInput of testInputs) {
    yield * testVisitorGenerator(testInput.code, testInput.description)
    console.log('\n' + '-'.repeat(40) + '\n') // Línea de separación entre tests
  }
}

function runTests () {
  console.log('Starting all tests...\n' + '='.repeat(40) + '\n')
  const testResults = runAllTestsGenerator()

  for (const result of testResults) {
    if (result.type === 'Visit Result') {
      console.log('Visitor Result:', result.result)
    } else if (result.type === 'Generated Fact') {
      console.log('Generated Fact:', result.fact)
    }
  }
  console.log('\n' + '='.repeat(40) + '\nAll tests completed.')
}

// Run all tests
runTests()
