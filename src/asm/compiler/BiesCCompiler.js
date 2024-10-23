// eslint-disable-next-line eol-last
// Clase principal del compilador
import BiesVMVisitor from './grammar/.antlr/BiesVMVisitor.js'
import { VMInstructions } from './VMInstructions.js'

export class BiesCCompiler extends BiesVMVisitor {
  constructor () {
    super()
    this.instructions = []
  }

  // Visit a parse tree produced by BiesVMParser#program
  visitProgram (ctx) {
    this.instructions.push(VMInstructions.startProgram())
    this.visitChildren(ctx)
    this.instructions.push(VMInstructions.endProgram())
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#letDeclaration
  visitLetDeclaration (ctx) {
    const identifier = ctx.IDENTIFIER().getText()
    this.instructions.push(VMInstructions.declareVar(identifier))
    this.visitChildren(ctx)
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#letInExpression
  visitLetInExpression (ctx) {
    this.visitLetDeclaration(ctx.letDeclaration())
    this.instructions.push(VMInstructions.enterScope())
    this.visit(ctx.expression()) // Visit the body of the let-in
    this.instructions.push(VMInstructions.exitScope())
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#funDeclaration
  visitFunDeclaration (ctx) {
    const funcName = ctx.IDENTIFIER().getText()
    this.instructions.push(VMInstructions.startFunction(funcName))
    this.visitParameterList(ctx.parameterList())
    this.visitExpressionBlock(ctx.expressionBlock())
    this.instructions.push(VMInstructions.endFunction())
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#parameterList
  visitParameterList (ctx) {
    ctx.parameter().forEach(param => {
      const paramName = param.IDENTIFIER().getText()
      this.instructions.push(VMInstructions.declareParam(paramName))
    })
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#listExpression
  visitListExpression (ctx) {
    const listItems = ctx.expressionList().expression().map(item => this.visit(item))
    this.instructions.push(VMInstructions.createList(listItems))
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#expressionStatement
  visitExpressionStatement (ctx) {
    const expr = this.visit(ctx.expression())
    this.instructions.push(VMInstructions.evaluateExpression(expr))
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#assignmentExpression
  visitAssignmentExpression (ctx) {
    const identifier = ctx.IDENTIFIER().getText()
    const value = this.visit(ctx.expression())
    this.instructions.push(VMInstructions.assignValue(identifier, value))
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#functionCall
  visitFunctionCall (ctx) {
    const funcName = ctx.IDENTIFIER().getText()
    this.instructions.push(VMInstructions.callFunction(funcName))
    return this.instructions
  }

  // Visit a parse tree produced by BiesVMParser#expression
  visitExpression (ctx) {
    // Handle various types of expressions
    if (ctx.logicalOrExpression()) {
      return this.visitLogicalOrExpression(ctx.logicalOrExpression())
    }
    // Additional cases for other expression types...
    return this.visitChildren(ctx)
  }

  // Handle logical or expressions
  visitLogicalOrExpression (ctx) {
    const left = this.visit(ctx.logicalAndExpression(0))
    const right = this.visit(ctx.logicalAndExpression(1))
    return this.instructions.push(VMInstructions.logicalOr(left, right))
  }

  // Visit a parse tree produced by BiesVMParser#expressionBlock
  visitExpressionBlock (ctx) {
    this.visitChildren(ctx)
    return this.instructions
  }

  // Additional visitor methods for handling other constructs...
}
