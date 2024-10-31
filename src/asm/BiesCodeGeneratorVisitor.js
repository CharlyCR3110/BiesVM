import BiesVMVisitor from '../asm/grammar/.antlr/BiesVMVisitor.js'

/**
 * Visitor class to handle BIES language constructs and build intermediate representations.
 * 
 * This class extends the BiesVMVisitor to traverse the parse tree
 * and collect instructions and function definitions.
 *
 * @class InstructionBuilderVisitor
 * @extends BiesVMVisitor
 * @authors
 * - Raquel Alfaro Barrantes
 * - Carlos González Garita
 * - Samuel Alfaro Rodríguez
 * - Isaac Felipe Brenes Calderón
 */

export default class BiesCodeGeneratorVisitor extends BiesVMVisitor {
  constructor () {
    super()
    this.instructions = []
    this.functions = {}
  }

 
  /**
   * 
    * Visits the program node and processes each statement.
   * @param {Object} ctx - The context of the program node.
   * @returns {Object} - Instructions and functions after visiting the program.
   */
  visitProgram(ctx) {
    this.visitChildren(ctx);
    return { instructions: this.instructions, functions: this.functions };
  }

 /**
 * Visits a let declaration, processing variable declarations in scope.
 * @param {Object} ctx - Context of letDeclaration node.
 */
  visitLetDeclaration(ctx){
    const simpleDeclaration = ctx.simpleDeclaration();
  if (simpleDeclaration) {
    const identifierNode = simpleDeclaration.IDENTIFIER();
    const expressionNode = simpleDeclaration.primaryExpression();
    
    // Verificar que el nodo del identificador y de la expresión existan
    if (identifierNode && expressionNode) {
      const identifier = identifierNode.getText();
      const value = this.visit(expressionNode);

      this.instructions.push({ op: 'declare_var', id: identifier, value });
      console.log(`Declaración LET simple: ${identifier} = ${value}`);
    } else {
      console.error('No se encontró el identificador o la expresión en la declaración LET simple.');
    }
  }

  return null;
  }

  /**
 * Visita el nodo primaryExpression y devuelve su valor.
 * Utiliza un mapa de funciones para despachar el tipo de nodo.
 * @param {Object} ctx - Contexto del nodo primaryExpression.
 * @returns {*} - El valor de la expresión primaria.
 */
visitPrimaryExpression(ctx) {
  const handlers = {
      NUMBER: () => parseFloat(ctx.NUMBER().getText()),
      STRING: () => ctx.STRING().getText().slice(1, -1), // Remueve comillas
      BOOLEAN: () => ctx.BOOLEAN().getText() === 'true',
      IDENTIFIER: () => ctx.IDENTIFIER().getText(),
      lambdaExpression: () => this.visit(ctx.lambdaExpression()),
      listExpression: () => this.visit(ctx.listExpression()),
      conditionalExpression: () => this.visit(ctx.conditionalExpression()),
      functionCall: () => this.visit(ctx.functionCall())
  };

  // Encuentra el primer tipo de nodo presente en `ctx` y lo maneja.
  for (const [key, handler] of Object.entries(handlers)) {
      if (ctx[key]()) {
          return handler();
      }
  }

  console.error('Expresión primaria no reconocida:', ctx.getText());
  return undefined;
}

  visitLetInDeclaration(ctx) {
    const variables = ctx.variableDeclarationBlock()
      ? ctx.variableDeclarationBlock().variableDeclaration() || []
      : [];

    variables.forEach(varDecl => {
      const identifierNode = varDecl.IDENTIFIER();
      if (identifierNode) {
        const varName = identifierNode.getText();
        console.log(`Variable: ${varName}`);
      } else {
        console.error('No se encontró IDENTIFIER en la declaración de variable.');
      }
    });

    return this.visitChildren(ctx);
  }

  /**
 * Visits each variable declaration within a block.
 * @param {Object} ctx - Context of variableDeclaration node.
 */
  visitVariableDeclaration(ctx) {
    const identifierNode = ctx.IDENTIFIER();
    if (!identifierNode.getText()) {
      console.error('No se encontró IDENTIFIER en el contexto de la declaración de variable.');
      return; // Manejo de error
    }

    const identifier = identifierNode.getText();
    const expressionValue = this.visit(ctx.primaryExpression());
    const valueToPush = Array.isArray(expressionValue) && expressionValue.length > 1 
        ? expressionValue // Si es un array con más de un elemento
        : expressionValue[0]; // Si no es un array o tiene un solo elemento
    this.instructions.push({ op: 'declare_var', id: identifier, value: expressionValue });
    return null;
  }

 /**
 * Visits function declarations, storing them in the function list.
 * @param {Object} ctx - Context of the funDeclaration node.
 */
  visitFunDeclaration(ctx) {
    const identifierNode = ctx.IDENTIFIER();
    if (!identifierNode) {
      console.error('No se encontró IDENTIFIER en la declaración de la función.');
      return; // Manejo de error
    }

    const functionName = identifierNode.getText();
    const parameterList = ctx.parameterList();
    const parameters = parameterList ? parameterList.IDENTIFIER().map(param => param.getText()) : [];

    // Guardar la función en el diccionario de funciones
    this.functions[functionName] = { parameters };
    console.log(`Función: ${functionName}, Parámetros: ${parameters.join(', ')}`);

    // Procesar el cuerpo de la función
    const functionBody = ctx.expression();
    this.instructions.push({ op: 'declare_func', id: functionName, parameters });

    // Visitar el cuerpo de la función
    this.visit(functionBody);
    return null;
  }
}