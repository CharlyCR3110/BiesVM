import BiesVMVisitor from '../asm/grammar/.antlr/BiesCVisitor.js'
import readline from 'readline'

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
    this.facts = []
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

  * factsGenerator () {
    for (const fact of this.facts) {
      yield fact
    }
  }

  visitLiteral (ctx) {
    const literal = ctx.BOOL_LITERAL()
      ? ctx.BOOL_LITERAL().getText()
      : ctx.STRING_LITERAL()
        ? ctx.STRING_LITERAL().getText().slice(1, -1)
        : parseFloat(ctx.NUMBER_LITERAL().getText())

    this.facts.push({ type: 'literal', value: literal })
    return literal
  }

  /**
     * Helper method to get user input from the console.
     * This method returns a promise that resolves with the user's input.
     * @returns {Promise<string>} A promise that resolves to the user input.
     * @memberof InpInstruction
     */
  async getUserInput (prompt) {
    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      readline.question(prompt, (value) => {
        readline.close()
        resolve(value) // Resolve the promise with the user input
      })
    })
  }

  visitIdentifier (ctx) {
    const name = ctx.getText()
    // console.log('Name: ',name)
    let env = this.environment
    this.facts.push({ type: 'identifier', name })
    // console.log('Estado de environment:', this.environment);
    while (env !== null) {
      if (env[name] !== undefined) {
        // console.log(env[name])
        return env[name]
      }
      env = Object.getPrototypeOf(env)
      // console.log('While...', env)
      
    }
    if (name === 'print') {
      return console.log
    } else if (name === 'input') {
      return async (prompt) => this.getUserInput(prompt || 'Enter input: ').then(value => value)
    } else if (name === 'int') {
      return (value) => {
        const num = parseInt(value, 10)
        if (isNaN(num)) throw new Error(`int: No se pudo convertir '${value}' a número`)
        return num
      }
    } else if (name === 'str') {
      return (value) => String(value)
    } else if (name === 'len') {
      return (value) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length
        } else {
          throw new Error('len: Tipo no soportado para \'len\'')
        }
      }
    } else {
      throw new Error(`Variable o función '${name}' no definida`)
    }
  }

  visitPrimaryExpr (ctx) {
    // console.log("Primary expression:", ctx.getText());
    const handlers = [
      { condition: () => ctx.identifier(), handler: () => this.visitIdentifier(ctx.identifier()) },
      { condition: () => ctx.literal(), handler: () => this.visitLiteral(ctx.literal()) },
      { condition: () => ctx.expression(), handler: () => this.visit(ctx.expression()) },
      { condition: () => ctx.lambdaExpr(), handler: () => this.visitLambdaExpr(ctx.lambdaExpr()) },
      { condition: () => ctx.letStatement(), handler: () => this.visitLetStatement(ctx.letStatement()) },
      { condition: () => ctx.ifThenElseExpr(), handler: () => this.visitIfThenElseExpr(ctx.ifThenElseExpr()) },
      { condition: () => ctx.listExpr(), handler: () => this.visitListExpr(ctx.listExpr()) },
      { condition: () => ctx.arrayAccess, handler: () => this.visitArrayAccess(ctx.arrayAccess()) }
      // to add more handlers use this template
      // { condition: () => ctx.<rule>(), handler: () => this.visit<Rule>(ctx.<rule>()) }
    ]

    for (const { condition, handler } of handlers) {
      if (condition()) {
        return handler()
      }
    }

    throw new Error(`Expresión primaria no soportada aún: ${ctx.getText()}`)
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
    const args = ctx.expression().map(expr => this.visit(expr))
    return args
  }

  visitUnaryExpr (ctx) {
    if (ctx.unaryExpr()) {
      const operator = ctx.getChild(0).getText()
      const value = this.visit(ctx.unaryExpr())
      const result = operator === '!' ? !value : -value
      this.facts.push({
        type: 'unaryExpression',
        operator,
        value,
        result
      })
      return result
    } else {
      return this.visit(ctx.postfixExpr())
    }
  }

  visitPowerExpr (ctx) {
    let result = this.visit(ctx.unaryExpr(0))
    // Si hay operadores '**' y procesamos la recursión
    const powerExprs = ctx.powerExpr() // Obtener todas las expresiones de potencia

    // Si hay operadores '**', las procesamos en orden
    for (let i = 0; i < powerExprs.length; i++) {
      const right = this.visit(powerExprs[i]) // Obtener el operando derecho de la potencia
      result = Math.pow(result, right) // Aplicar la potencia
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
      this.facts.push({
        type: 'multiplicativeExpression',
        operator,
        right,
        result
      })
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
      this.facts.push({
        type: 'additiveExpression',
        operator,
        right,
        result
      })
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
      this.facts.push({
        type: 'relationalExpression',
        operator,
        right,
        result
      })
    }

    return result
  }

  visitEqualityExpr (ctx) {
    let result = this.visit(ctx.relationalExpr(0))
    // console.log(result)
    for (let i = 1; i < ctx.relationalExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.relationalExpr(i))
      if (operator === '==') {
        /* eslint-disable eqeqeq */
        // console.log('Eq',result,'==',right)
        result = result == right
      } else if (operator === '!=') {
        result = result != right
      }
      this.facts.push({
        type: 'equalityExpression',
        operator,
        right,
        result
      })
    }
    // console.log(result)
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
    // console.log("Tipo de declaración:", ctx.getText());
    const handlers = [
      { condition: () => ctx.letStatement(), handler: () => this.visit(ctx.letStatement()) },
      { condition: () => ctx.constStatement(), handler: () => this.visit(ctx.constStatement()) },
      { condition: () => ctx.varStatement(), handler: () => this.visit(ctx.varStatement()) },
      { condition: () => ctx.funDeclaration(), handler: () => this.visit(ctx.funDeclaration()) },
      { condition: () => ctx.expressionStatement(), handler: () => this.visit(ctx.expressionStatement()) },
      { condition: () => ctx.letInExpr(), handler: () => this.visit(ctx.letInExpr()) },
      { condition: () => ctx.ifThenElseExpr(), handler: () => this.visit(ctx.ifThenElseExpr()) }
    ]

    for (const { condition, handler } of handlers) {
      if (condition()) {
        return handler()
      }
    }

    throw new Error(`Declaración de sentencia no soportada: ${ctx.getText()}`)
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

    this.facts.push({
      type: 'letStatement',
      name,
      value
    })

    return value
  }

  visitConstStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = this.visit(ctx.expression())

    if (this.environment[name] !== undefined) {
      throw new Error(`Variable ${name} ya definida`)
    }
    // console.log('VALUE 1: ',value, 'NAME: ', name)
    Object.defineProperty(this.environment, name, {
      value,
      writable: false,
      configurable: false
    })

    this.facts.push({
      type: 'constStatement',
      name,
      value
    })
    // console.log(this.facts)
    return value
  }

  visitVarStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = this.visit(ctx.expression())

    // Permitir la redeclaración en var
    this.environment[name] = value

    this.facts.push({
      type: 'varStatement',
      name,
      value
    })
    return value
  }

  visitLambdaExpr (ctx) {
    const params = ctx.paramList() 
        ? ctx.paramList().identifier().map(id => id.getText()) 
        : []
    const body = ctx.expression() || ctx.letInExpr()
    const self  = this
    console.log(`Parametros del lambda`,params)
    const oldEnv = self.environment
    const func = function () {

      console.log("Function arguments:", arguments)
      const newEnv = Object.assign({},oldEnv)
      for (let i = 0; i < arguments.length; i++) {
        newEnv[params[i]] = arguments[i]
        console.log(newEnv[params[i]], params[i])
      }
      
      console.log('Old environment',oldEnv)
      self.environment = newEnv
      console.log(newEnv)
      let result
      if (body) {
        if (ctx.letInExpr()) {
          result = self.visit(ctx.letInExpr())
        }else{
          result = self.visit(body)
        }
        self.environment = oldEnv
      }
      console.log("Exit function, ", result)
      console.log("Ultimo environment function", self.environment)
      return result
    }
    console.log("Exit lambda",func)
    console.log("Ultimo environment lambda", this.environment)
    return func
  }

  // Agrega este método a tu clase BiesCodeGeneratorVisitor
  visitLetInExpr (ctx) {
    const environmentBackup = { ...this.environment } // Guardar el entorno actual para restaurarlo después
    // Procesar todas las declaraciones dentro de let {...}

    const statements = ctx.constStatement() || ctx.letStatement() || ctx.varStatement()
    for (const stmt of statements) {
      this.visit(stmt) // Procesa cada declaración
    }

    // Procesar la expresión final en 'in { ... }'
    const result = this.visit(ctx.expression())
    this.environment = environmentBackup // Restaurar el entorno original
    return result
  }

  visitIfThenElseExpr (ctx) {
    const condition = this.visit(ctx.expression(0))
    // console.log(`Evaluando if con condición: ${condition}`)
    let result
    if (condition) { result = this.visit(ctx.expression(1)) } else { result = this.visit(ctx.expression(2)) }

    return result
  }

  visitListExpr (ctx) {
    const elements = ctx.expression().map(expr => this.visit(expr))
    this.facts.push({ type: 'list', elements })
    // console.log('Elemenos de la lista: ', elements)
    return elements
  }

  visitArrayAccess (ctx) {
    const arrayName = ctx.IDENTIFIER().getText()
    const index = this.visit(ctx.expression())
    const array = this.environment[arrayName]
    if (!Array.isArray(array)) {
      throw new Error(`Se intentó acceder a '${arrayName}' que no es un array`)
    }
    if (typeof index !== 'number' || index < 0 || index >= array.length) {
      throw new Error(`Índice fuera de rango: ${index} para el array '${arrayName}'`)
    }

    const value = array[index]

    this.facts.push({ type: 'arrayAccess', arrayName, index, value })

    return value
  }
}
