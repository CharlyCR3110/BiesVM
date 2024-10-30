import BiesVMVisitor from '../asm/grammar/.antlr/BiesVMVisitor.js'

/**
 * Visitor class to handle BIES language constructs and build intermediate representations.
 * 
 * This class extends the BiesASMVisitor to traverse the parse tree
 * and collect instructions and function definitions.
 *
 * @class InstructionBuilderVisitor
 * @extends BiesASMVisitor
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
visitLetDeclaration(ctx) {
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
  const expressionValue = this.visit(ctx.expression());
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
    console.error('No se encontró IDENTIFIER en la declaración de función.');
    return; // Manejo de error
  }

  const name = identifierNode.getText();
  const params = ctx.parameterList()?.IDENTIFIER().map(id => id.getText()) || [];
  const functionBody = this.visit(ctx.expression());
  this.functions[name] = { params, body: functionBody };
  return null;
}

/**
 * Visits an expression and determines its type, handling assignments.
 * @param {Object} ctx - Context of expression node.
 */
visitExpression(ctx) {
  if (ctx.assignmentExpression()) {
    return this.visitAssignmentExpression(ctx.assignmentExpression());
  }
  return this.visitChildren(ctx);
}

/**
 * Processes assignment expressions and stores assignment instructions.
 * @param {Object} ctx - Context of assignmentExpression node.
 */
visitAssignmentExpression(ctx) {
  const identifierNode = ctx.IDENTIFIER();
  if (!identifierNode) {
    console.error('No se encontró IDENTIFIER en el contexto de la expresión de asignación.');
    return; // Manejo de error
  }

  const identifier = identifierNode.getText();
  const value = this.visit(ctx.expression());
  this.instructions.push({ op: 'assign', id: identifier, value });
  return value;
}

/**
 * Visits function calls, adds a call instruction to the instructions list.
 * @param {Object} ctx - Context of functionCall node.
 */
visitFunctionCall(ctx) {
  const identifierNode = ctx.IDENTIFIER();
  if (!identifierNode) {
    console.error('No se encontró IDENTIFIER en la llamada a la función.');
    return; // Manejo de error
  }

  const funcName = identifierNode.getText();
  const args = ctx.argumentList()?.expression().map(expr => this.visit(expr)) || [];
  this.instructions.push({ op: 'call', func: funcName, args });
  return null;
}

/**
 * Visits logical and arithmetic expressions.
 * @param {Object} ctx - Context of logicalOrExpression node.
 */
visitLogicalOrExpression(ctx) {
  const left = this.visit(ctx.logicalAndExpression(0));
  if (ctx.logicalAndExpression().length > 1) {
    const right = this.visit(ctx.logicalAndExpression(1));
    this.instructions.push({ op: 'logical_or', left, right });
  }
  return left;
}

/**
 * Processes list expressions, creating lists from expressions.
 * @param {Object} ctx - Context of listExpression node.
 */
visitListExpression(ctx) {
  const elements = ctx.expressionList()?.expression().map(expr => this.visit(expr)) || [];
  return { type: 'list', elements };
}

/**
 * Visits expression blocks, handling nested expressions.
 * @param {Object} ctx - Context of expressionBlock node.
 */
visitExpressionBlock(ctx) {
  const exprs = ctx.expression().map(expr => this.visit(expr));
  return exprs;
}
}