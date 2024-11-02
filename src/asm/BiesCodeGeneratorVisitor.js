import BiesVMVisitor from '../asm/grammar/.antlr/BiesVMVisitor.js'

/**
 * Visitor class to handle BIES language constructs and build intermediate representations.
 * 
 * This class extends the BiesVMVisitor to traverse the parse tree
 * and collect facts and function definitions.
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
    this.facts = []
  }

 
  /**
   * 
    * Visits the program node and processes each statement.
   * @param {Object} ctx - The context of the program node.
   * @returns {Object} - facts and functions after visiting the program.
   */
  visitProgram(ctx) {
    this.visitChildren(ctx);
    return { facts: this.facts};
  }

 /**
 * Visits a let declaration, processing variable declarations in scope.
 * @param {Object} ctx - Context of letDeclaration node.
 */
 visitLetDeclaration(ctx) {
  const varDecl = ctx.simpleDeclaration();
  if (varDecl) {
    const identifier = varDecl.IDENTIFIER().getText();
    const expression = varDecl.primaryExpression();
    const value = expression ? this.visit(expression) : null; // Visit the primary expression if it exists
    console.log(`Variable: ${identifier}, Valor (let): ${JSON.stringify(value)}`);
    this.facts.push({ name: identifier, value });
  }
  return this.visitChildren(ctx);
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
    const varName = identifierNode ? identifierNode.getText() : null;
    const expressionValue = varDecl.primaryExpression()
      ? this.visit(varDecl.primaryExpression())
      : null;
      const expressionBlock = this.visit(ctx.expressionBlock());

    if (varName && expressionValue && expressionBlock) {
      console.log(`Variable: ${varName}, Valor (let-in): ${JSON.stringify(expressionValue)} body: ${JSON.stringify(expressionBlock)}}`);
      this.facts.push({ op: 'declare_var', id: varName, value: expressionValue, body: expressionBlock });
    }
  });

  return this.visitChildren(ctx);
}


  /**
 * Visits each variable declaration within a block.
 * @param {Object} ctx - Context of variableDeclaration node.
 */
  // visitVariableDeclaration(ctx) {
  //   const identifierNode = ctx.IDENTIFIER();
  //   if (!identifierNode.getText()) {
  //     console.error('No se encontró IDENTIFIER en el contexto de la declaración de variable.');
  //     return; // Manejo de error
  //   }

  //   const identifier = identifierNode.getText();
  //   const expressionValue = this.visit(ctx.primaryExpression());
  //   console.log(`Variable: ${identifier}, Value: ${JSON.stringify(expressionValue)}`);
  //   this.facts.push({ op: 'declare_var', id: identifier, value: expressionValue });
  //   return null;
  // }
  
  visitListExpression(ctx) {
    const expressions = ctx.primaryExpression().map(exprCtx => this.visit(exprCtx));
    return expressions; 
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
    this.facts.push({ op: 'declare_func', id: functionName, parameters });

    // Visitar el cuerpo de la función
    this.visit(functionBody);
    return null;
  }

  visitFunction(ctx) {
    const functionName = ctx.children[0].getText(); // Obtener el nombre de la función
    const argument = ctx.primaryExpression() ? this.visit(ctx.primaryExpression()) : undefined; // Obtener el argumento

    // Mapa de funciones
    const handlers = {
      print: () => this.addFunctionCall(functionName, { type: 'print', value: argument }),
      input: () => this.addFunctionCall(functionName, { type: 'input', value: null }), // Placeholder para entrada
      int: () => this.addFunctionCall(functionName, { type: 'int', value: parseInt(argument, 10) }),
      str: () => this.addFunctionCall(functionName, { type: 'str', value: String(argument) }),
      bool: () => this.addFunctionCall(functionName, { type: 'bool', value: Boolean(argument) }),
      list: () => this.addFunctionCall(functionName, { type: 'list', value: argument }),
      len: () => this.addFunctionCall(functionName, { type: 'len', value: argument.length })
    };

    // Ejecutar el manejador correspondiente si existe
    if (handlers[functionName]) {
      handlers[functionName](); // Llamar al manejador y guardar en facts
    } else {
      console.error(`Función no reconocida: ${functionName}`);
    }
  }

  /**
   * Adds a function call result to the facts array.
   * @param {string} functionName - The name of the function.
   * @param {Object} result - The result of the function call.
   */
  addFunctionCall(functionName, result) {
    const functionCall = {
      functionName,
      ...result
    };
    this.facts.push(functionCall); // Agregar el resultado al stack de instrucciones
  }
  
}
