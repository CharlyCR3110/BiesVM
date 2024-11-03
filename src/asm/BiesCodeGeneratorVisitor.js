import BiesVMVisitor from '../asm/grammar/.antlr/BiesCVisitor.js'

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
    this.environment = {}
  }

  /**
   *
    * Visits the program node and processes each statement.
   * @param {Object} ctx - The context of the program node.
   * @returns {Object} - facts and functions after visiting the program.
   */
  visitProgram (ctx) {
    const statements = ctx.statement()
    for (const stmt of statements) {
      this.visit(stmt)
    }
  }

  visitLiteral (ctx) {
    if (ctx.BOOL_LITERAL()) {
      return ctx.BOOL_LITERAL().getText() === 'true'
    } else if (ctx.STRING_LITERAL()) {
      const text = ctx.STRING_LITERAL().getText()
      return text.slice(1, -1) // Remover comillas
    } else if (ctx.NUMBER_LITERAL()) {
      return parseFloat(ctx.NUMBER_LITERAL().getText())
    }
  }

  visitIdentifier (ctx) {
    const name = ctx.getText()
    let env = this.environment
    while (env !== null) {
      if (env[name] !== undefined) {
        return env[name]
      }
      env = Object.getPrototypeOf(env)
    }
    if (name === 'print') {
      return console.log
    } else {
      throw new Error(`Variable ${name} no definida`)
    }
  }

  visitPrimaryExpr (ctx) {
    if (ctx.identifier()) {
      return this.visitIdentifier(ctx.identifier())
    } else if (ctx.literal()) {
      return this.visitLiteral(ctx.literal())
    } else if (ctx.expression()) {
      return this.visit(ctx.expression())
    } else if (ctx.lambdaExpr()) {
      return this.visitLambdaExpr(ctx.lambdaExpr())
    } else {
      throw new Error(`Expresión primaria no soportada aún ${ctx.getText()}`)
    }
  }

  visitPostfixExpr (ctx) {
    let result = this.visit(ctx.primaryExpr())
    const postfixOps = ctx.postfixOp()
    for (const op of postfixOps) {
      result = this.visitPostfixOp(op, result)
    }
    return result
  }

  visitPostfixOp (ctx, func) {
    if (ctx.argumentList()) {
      const args = this.visitArgumentList(ctx.argumentList())
      if (typeof func === 'function') {
        return func(...args)
      } else {
        throw new Error('Intento de llamar a un valor no función')
      }
    } else {
      if (typeof func === 'function') {
        return func()
      } else {
        throw new Error('Intento de llamar a un valor no función')
      }
    }
  }

  visitArgumentList (ctx) {
    return ctx.expression().map(expr => this.visit(expr))
  }

  visitUnaryExpr (ctx) {
    if (ctx.unaryExpr()) {
      const operator = ctx.getChild(0).getText()
      const value = this.visit(ctx.unaryExpr())
      if (operator === '!') {
        return !value
      } else if (operator === '-') {
        return -value
      }
    } else {
      return this.visit(ctx.postfixExpr())
    }
  }

  visitPowerExpr (ctx) {
    let result = this.visit(ctx.unaryExpr(0))
    for (let i = 1; i < ctx.unaryExpr().length; i++) {
      const right = this.visit(ctx.powerExpr(i))
      result = Math.pow(result, right)
    }
    return result
  }

  visitMultiplicativeExpr (ctx) {
    let result = this.visit(ctx.powerExpr(0))
    for (let i = 1; i < ctx.powerExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.powerExpr(i))
      if (operator === '*') {
        result *= right
      } else if (operator === '/') {
        result /= right
      }
    }
    return result
  }

  visitAdditiveExpr (ctx) {
    let result = this.visit(ctx.multiplicativeExpr(0))
    for (let i = 1; i < ctx.multiplicativeExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.multiplicativeExpr(i))
      if (operator === '+') {
        if (typeof result === 'string' || typeof right === 'string') {
          result = String(result) + String(right)
        } else {
          result += right
        }
      } else if (operator === '-') {
        result -= right
      }
    }
    return result
  }

  visitRelationalExpr (ctx) {
    let result = this.visit(ctx.additiveExpr(0))
    for (let i = 1; i < ctx.additiveExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.additiveExpr(i))
      if (operator === '>') {
        result = result > right
      } else if (operator === '>=') {
        result = result >= right
      } else if (operator === '<') {
        result = result < right
      } else if (operator === '<=') {
        result = result <= right
      }
    }
    return result
  }

  visitEqualityExpr (ctx) {
    let result = this.visit(ctx.relationalExpr(0))
    for (let i = 1; i < ctx.relationalExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.relationalExpr(i))
      if (operator === '==') {
        /* eslint-disable eqeqeq */
        result = result == right
      } else if (operator === '!=') {
        result = result != right
      }
    }
    return result
  }

  visitLogicalAndExpr (ctx) {
    let result = this.visit(ctx.equalityExpr(0))
    for (let i = 1; i < ctx.equalityExpr().length; i++) {
      result = result && this.visit(ctx.equalityExpr(i))
    }
    return result
  }

  visitLogicalOrExpr (ctx) {
    let result = this.visit(ctx.logicalAndExpr(0))
    for (let i = 1; i < ctx.logicalAndExpr().length; i++) {
      result = result || this.visit(ctx.logicalAndExpr(i))
    }
    return result
  }

  visitExpression (ctx) {
    return this.visit(ctx.logicalOrExpr())
  }

  visitExpressionStatement (ctx) {
    return this.visit(ctx.expression())
  }

  visitStatement (ctx) {
    if (ctx.letStatement()) {
      return this.visit(ctx.letStatement())
    } else if (ctx.constStatement()) {
      return this.visit(ctx.constStatement())
    } else if (ctx.varStatement()) {
      return this.visit(ctx.varStatement())
    } else if (ctx.funDeclaration()) {
      return this.visit(ctx.funDeclaration())
    } else if (ctx.expressionStatement()) {
      return this.visit(ctx.expressionStatement())
    }
  }

  visitLetStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = this.visit(ctx.expression())
    if (name === undefined) {
      throw new Error('visitLetStatement: Nombre indefinido')
    }
    if (value === undefined) {
      throw new Error('visitLetStatement: Valor indefinido')
    }

    if (this.environment[name] !== undefined) {
      throw new Error(`Variable ${name} ya definida`)
    }

    this.environment[name] = value

    return value
  }

  visitLambdaExpr (ctx) {
    const params = ctx.paramList() ? ctx.paramList().identifier().map(id => id.getText()) : []
    const body = ctx.expression()
    const self = this
    const func = function () {
      const newEnv = Object.create(self.environment)
      for (let i = 0; i < arguments.length; i++) {
        newEnv[params[i]] = arguments[i]
      }
      const oldEnv = self.environment
      self.environment = newEnv
      const result = self.visit(body)
      self.environment = oldEnv
      return result
    }

    return func
  }
}
