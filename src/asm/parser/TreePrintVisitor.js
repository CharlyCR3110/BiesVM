import BiesVMVisitor from '../grammar/.antlr/BiesVMVisitor.js'

export class TreePrintVisitor extends BiesVMVisitor {
  // Programa (root node)
  visitProgram (ctx) {
    console.log('Program')
    return this.visitChildren(ctx)
  }

  // Declaraciones let/var
  visitLetDeclaration (ctx) {
    console.log('Let Declaration')
    return this.visitChildren(ctx)
  }

  // Bloque de declaraciones
  visitVariableDeclarationBlock (ctx) {
    console.log('Variable Declaration Block')
    return this.visitChildren(ctx)
  }

  // Declaración de una variable (const/var)
  visitVariableDeclaration (ctx) {
    if (ctx.CONST()) {
      console.log(`Const Declaration: ${ctx.IDENTIFIER().getText()}`)
    } else if (ctx.VAR()) {
      console.log(`Var Declaration: ${ctx.IDENTIFIER().getText()}`)
    }
    return this.visitChildren(ctx)
  }

  // Declaración de función
  visitFunDeclaration (ctx) {
    console.log(`Function Declaration: ${ctx.IDENTIFIER().getText()}`)
    return this.visitChildren(ctx)
  }

  // Lista de parámetros de la función
  visitParameterList (ctx) {
    const params = ctx.IDENTIFIER().map(id => id.getText()).join(', ')
    console.log(`Parameters: ${params}`)
    return this.visitChildren(ctx)
  }

  // Expresiones
  visitExpressionStatement (ctx) {
    console.log('Expression Statement')
    return this.visitChildren(ctx)
  }

  // Expresión primaria
  visitPrimaryExpression (ctx) {
    if (ctx.NUMBER()) {
      console.log(`Number: ${ctx.NUMBER().getText()}`)
    } else if (ctx.STRING()) {
      console.log(`String: ${ctx.STRING().getText()}`)
    } else if (ctx.BOOLEAN()) {
      console.log(`Boolean: ${ctx.BOOLEAN().getText()}`)
    } else if (ctx.IDENTIFIER()) {
      console.log(`Identifier: ${ctx.IDENTIFIER().getText()}`)
    }
    return this.visitChildren(ctx)
  }

  // Llamada a función
  visitFunctionCall (ctx) {
    console.log(`Function Call: ${ctx.IDENTIFIER().getText()}`)
    return this.visitChildren(ctx)
  }

  // Bloque de expresiones
  visitExpressionBlock (ctx) {
    console.log('Expression Block')
    return this.visitChildren(ctx)
  }

  // Expresión de listas
  visitListExpression (ctx) {
    console.log('List Expression')
    return this.visitChildren(ctx)
  }

  // Lambdas
  visitLambdaExpression (ctx) {
    console.log('Lambda Expression')
    return this.visitChildren(ctx)
  }

  // Expresiones de asignación
  visitAssignmentExpression (ctx) {
    console.log(`Assignment: ${ctx}`)
    return this.visitChildren(ctx)
  }

  // Expresiones lógicas
  visitLogicalOrExpression (ctx) {
    console.log('Logical OR Expression')
    return this.visitChildren(ctx)
  }

  visitLogicalAndExpression (ctx) {
    console.log('Logical AND Expression')
    return this.visitChildren(ctx)
  }

  visitEqualityExpression (ctx) {
    console.log('Equality Expression')
    return this.visitChildren(ctx)
  }

  visitRelationalExpression (ctx) {
    console.log('Relational Expression')
    return this.visitChildren(ctx)
  }

  visitAdditiveExpression (ctx) {
    console.log('Additive Expression')
    return this.visitChildren(ctx)
  }

  visitMultiplicativeExpression (ctx) {
    console.log('Multiplicative Expression')
    return this.visitChildren(ctx)
  }

  visitUnaryExpression (ctx) {
    if (ctx.getText() === '!') {
      console.log('Unary Expression: Not')
    } else {
      console.log('Unary Expression')
    }
    return this.visitChildren(ctx)
  }
}
