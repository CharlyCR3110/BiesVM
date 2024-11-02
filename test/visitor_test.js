import antlr4 from 'antlr4';  // Importa el módulo antlr4
import BiesVMParser from '../src/asm/grammar/.antlr/BiesVMParser.js'
import BiesVMLexer from '../src/asm/grammar/.antlr/BiesVMLexer.js'
import BiesCodeGeneratorVisitor from '../src/asm/BiesCodeGeneratorVisitor.js';
import BiesVMVisitor from '../src/asm/grammar/.antlr/BiesVMVisitor.js';

function testVisitor(input) {
    const chars = new antlr4.InputStream(input);
    const lexer = new BiesVMLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new BiesVMParser(tokens);
    
    // Analizar el input
    const tree = parser.program(); // Asumiendo que 'program' es la regla raíz de tu gramática

    const visitor = new BiesCodeGeneratorVisitor();
    const result = visitor.visit(tree); // Visita el árbol de análisis

    console.log("Resultado de la visita al árbol:");
    console.log(result); // Imprime el resultado
}

// Ejemplo de entrada para probar
const inputProgram = `
// Version compleja 0
print("Testing helloworld Version 0 ***")
print("Hello World!") 
let x= 666
let {var a= 555 var b= 2} in {a + b}
`;

testVisitor(inputProgram);