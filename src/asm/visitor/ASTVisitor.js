import BiesVMVisitor from '../grammar/.antlr/BiesVMVisitor.js'
import VMInstructions from '../instructions/VMInstructions.js'

export class ExpreVisitor extends BiesVMVisitor {
  // Visitar expresiones lógicas OR
  visitLogicalOrExpression (ctx) {
    const left = this.visit(ctx.logicalAndExpression(0))
    const right = this.visit(ctx.logicalAndExpression(1))
    return VMInstructions.logicalOr(left, right)
  }

  // Visitar expresiones lógicas AND
  visitLogicalAndExpression (ctx) {
    const left = this.visit(ctx.equalityExpression(0))
    const right = this.visit(ctx.equalityExpression(1))
    return VMInstructions.logicalAnd(left, right)
  }

  // Visitar expresiones de igualdad
  visitEqualityExpression (ctx) {
    const left = this.visit(ctx.relationalExpression(0))
    const right = this.visit(ctx.relationalExpression(1))
    if (ctx.EQUAL()) {
      return VMInstructions.equal(left, right)
    } else {
      return VMInstructions.notEqual(left, right)
    }
  }

  // Visitar expresiones relacionales
  visitRelationalExpression (ctx) {
    const left = this.visit(ctx.additiveExpression(0))
    const right = this.visit(ctx.additiveExpression(1))
    if (ctx.LESS()) {
      return VMInstructions.lessThan(left, right)
    } else if (ctx.GREATER()) {
      return VMInstructions.greaterThan(left, right)
    } else if (ctx.LESS_EQUAL()) {
      return VMInstructions.lessThanOrEqual(left, right)
    } else if (ctx.GREATER_EQUAL()) {
      return VMInstructions.greaterThanOrEqual(left, right)
    }
    return left // En caso de no ser una expresión relacional
  }

  // Visitar expresiones aditivas
  visitAdditiveExpression (ctx) {
    const left = this.visit(ctx.multiplicativeExpression(0))
    const right = this.visit(ctx.multiplicativeExpression(1))
    if (ctx.PLUS()) {
      return VMInstructions.add(left, right)
    } else if (ctx.MINUS()) {
      return VMInstructions.subtract(left, right)
    }
    return left // En caso de no ser una expresión aditiva
  }

  // Visitar expresiones multiplicativas
  visitMultiplicativeExpression (ctx) {
    const left = this.visit(ctx.unaryExpression(0))
    const right = this.visit(ctx.unaryExpression(1))
    if (ctx.TIMES()) {
      return VMInstructions.multiply(left, right)
    } else if (ctx.DIVIDE()) {
      return VMInstructions.divide(left, right)
    }
    return left // En caso de no ser una expresión multiplicativa
  }

  // Visitar expresiones unarias
  visitUnaryExpression (ctx) {
    const operand = this.visit(ctx.unaryExpression())
    if (ctx.MINUS()) {
      return VMInstructions.negate(operand)
    } else if (ctx.NOT()) {
      return VMInstructions.not(operand)
    }
    return operand // En caso de no ser una expresión unaria
  }

  // Visitar expresiones primarias
  visitPrimaryExpression (ctx) {
    if (ctx.NUMBER()) {
      return VMInstructions.pushNumber(ctx.NUMBER().getText())
    } else if (ctx.STRING()) {
      return VMInstructions.pushString(ctx.STRING().getText())
    } else if (ctx.BOOLEAN()) {
      return VMInstructions.pushBoolean(ctx.BOOLEAN().getText())
    } else if (ctx.IDENTIFIER()) {
      return VMInstructions.loadVariable(ctx.IDENTIFIER().getText())
    } else if (ctx.listExpression()) {
      return this.visitListExpression(ctx.listExpression())
    } else if (ctx.functionCall()) {
      return this.visitFunctionCall(ctx.functionCall())
    }
    return null // En caso de que no coincida con ninguna expresión primaria
  }

  // Visitar llamadas a funciones
  visitFunctionCall (ctx) {
    const funcName = ctx.IDENTIFIER().getText()
    const args = ctx.argumentList().expression().map(arg => this.visit(arg))
    return VMInstructions.callFunction(funcName, args)
  }

  // Visitar expresiones de lista
  visitListExpression (ctx) {
    const listItems = ctx.expressionList().expression().map(item => this.visit(item))
    return VMInstructions.createList(listItems)
  }
}
