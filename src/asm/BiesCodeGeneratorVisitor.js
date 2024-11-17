import BiesVMVisitor from '../asm/grammar/.antlr/BiesCVisitor.js'
import readline from 'readline'
import fs from 'fs'

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
    this.functionCount = 0
    this.variableIndex = 0 // Contador para variables
    this.instructions = []
    this.environment = {}
    this.variables = {}
    this.facts = []
    this.functions = []
  }

  /**
   *
    * Visits the program node and processes each statement.
   * @param {Object} ctx - The context of the program node.
   * @returns {Object} - facts and functions after visiting the program.
   */
  visitProgram (ctx) {
    this.emit('; Authors:')
    this.emit('; Raquel Alfaro Barrantes, Carlos González Garita')
    this.emit('; Samuel Alfaro Rodríguez, Isaac Felipe Brenes Calderón')
    this.emit('$FUN $0 args:0 parent:$0')
    const statements = ctx.statement()
    for (const stmt of statements) {
      this.visit(stmt)
    }
    this.emit('HLT') // Fin del programa principal
    this.emit('$END')
    this.writeFunctions()
  }

  * factsGenerator () {
    for (const fact of this.facts) {
      yield fact
    }
  }

  emit (instruction) {
    this.instructions.push(instruction)
  }

  visitLiteral (ctx) {
    const literal = ctx.BOOL_LITERAL()
      ? ctx.BOOL_LITERAL().getText()
      : ctx.STRING_LITERAL()
        ? ctx.STRING_LITERAL().getText().slice(1, -1)
        : parseFloat(ctx.NUMBER_LITERAL().getText())

    this.facts.push({ type: 'literal', value: literal })
    // Determinar el formato del valor a cargar
    const loadValue = typeof literal === 'string'
      ? `"${literal}"`
      : literal;
    (this.variables[loadValue] !== undefined)
      ? this.emit(`BLD 0 ${this.variables[ctx.getText()]}`)
      : this.emit(`LDV ${loadValue}`)
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

  writeFunctions () {
    this.functions.forEach(func => {
      // Emitir la declaración de la función con el ID y el número de parámetros
      this.emit(`$FUN ${func.funcID} args:${func.params.length} parent:$0`)

      // Guardar los parámetros de la función en el entorno
      func.params.forEach((param, index) => {
        // Guardamos el parámetro en el entorno con su índice
        this.variables[param] = index
        this.environment[param] = index
      })
      // Procesar el cuerpo de la función
      this.visit(func.body)
      this.emit('RET') // Retorno de la función
      this.emit('$END') // Fin de la declaración de la función
    })
  }

  generateFunctionID () {
    this.functionCount++
    return `$${this.functionCount}`
  }

  visitIdentifier (ctx) {
    const name = ctx.getText()
    let env = this.environment
    this.facts.push({ type: 'identifier', name })
    if (this.variables[name] !== undefined) {
      this.emit(`BLD 0 ${this.variables[name]}`)
    }
    while (env !== null) {
      if (env[name] !== undefined) {
        if (env[name].name === 'func') { this.emit('APP') }
        return env[name]
      }
      env = Object.getPrototypeOf(env)
    }
    if (name === 'print') {
      this.emit('PRN')
      return () => { }
    } else if (name === 'input') {
      this.emit('INP')
      return name
    } else if (name === 'int') {
      this.emit('INT')
      return (value) => {
        const num = parseInt(value, 10)
        if (isNaN(num)) throw new Error(`int: No se pudo convertir '${value}' a número`)
        return num
      }
    } else if (name === 'str') {
      this.emit('STR')
      return (value) => {
        //  const stringVal = String(value)
        // this.emit(`LDV ${stringVal}`)
        return String(value)
      }
    } else if (name === 'len') {
      this.emit('LEN')
      return (value) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length
        } else {
          // throw new Error('len: Tipo no soportado para \'len\'')
        }
      }
    } else {
      if (this.variables[name] === undefined) throw new Error(`Variable o función '${name}' no definida`)
    }
  }

  visitPrimaryExpr (ctx) {
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
      if (func !== 'input') {
        const args = this.visitArgumentList(ctx.argumentList())
        if (typeof func === 'function') {
          return func(...args)
        } else {
          throw new Error('Intento de llamar a un valor no función')
        }
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
    const functionCall = this.instructions.pop()
    const f = (functionCall.startsWith('APP')) ? this.instructions.pop() : null
    const args = ctx.expression().map(expr => this.visit(expr))
    if (f !== null) {
      this.emit(`${f}`)
      this.emit(`${functionCall}`)
    } else if (functionCall === 'STR') this.emit("CST string")
    else if (functionCall === 'INT') this.emit("CST int")
    else this.emit(`${functionCall}`)
    return args
  }

  visitUnaryExpr (ctx) {
    if (ctx.unaryExpr()) {
      const operator = ctx.getChild(0).getText()
      const value = this.visit(ctx.unaryExpr())
      const result = operator === '!' ? !value : -value;
      (operator === '!')
        ? this.emit('NOT')
        : this.emit('NEG')
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
      this.emit('POW')
    }
    return result
  }

  visitMultiplicativeExpr (ctx) {
    let result = this.visit(ctx.powerExpr(0))
    for (let i = 1; i < ctx.powerExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.powerExpr(i))
      if (operator === '*') {
        this.emit('MUL')
        result *= right
      } else if (operator === '/') {
        this.emit('DIV')
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
          const sum1 = this.instructions.pop()
          const sum2 = this.instructions.pop()
          this.emit(`${sum2}`)
          if (sum2.startsWith('BLD')) this.emit("CST string")
          this.emit(`${sum1}`)
          if (sum1.startsWith('BLD')) this.emit("CST string")
          this.emit('CAT')
        } else {
          result += right
          this.emit('ADD')
        }
      } else if (operator === '-') {
        result -= right
        this.emit('SUB')
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
        this.emit('GT')
      } else if (operator === '>=') {
        result = result >= right
        this.emit('GTE')
      } else if (operator === '<') {
        result = result < right
        this.emit('LT')
      } else if (operator === '<=') {
        result = result <= right
        this.emit('LTE')
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
    for (let i = 1; i < ctx.relationalExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      const right = this.visit(ctx.relationalExpr(i))
      if (operator === '==') {
        /* eslint-disable eqeqeq */
        result = result == right
        this.emit('EQ')
      } else if (operator === '!=') {
        result = result != right
        this.emit('EQ')
        this.emit('NOT')
      }
      this.facts.push({
        type: 'equalityExpression',
        operator,
        right,
        result
      })
    }
    return result
  }

  visitLogicalAndExpr (ctx) {
    let result = this.visit(ctx.equalityExpr(0))
    for (let i = 1; i < ctx.equalityExpr().length; i++) {
      result = result && this.visit(ctx.equalityExpr(i))
      this.emit('AND')
    }
    return result
  }

  visitLogicalOrExpr (ctx) {
    let result = this.visit(ctx.logicalAndExpr(0))
    for (let i = 1; i < ctx.logicalAndExpr().length; i++) {
      const visit = this.visit(ctx.logicalAndExpr(i))
      result = result || visit
      this.emit('OR')
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
    this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
    this.variables[name] = this.variableIndex
    this.variableIndex++ // Aumentar el índice para la siguiente variable
    return value
  }

  visitConstStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = this.visit(ctx.expression())

    if (this.environment[name] !== undefined) {
      throw new Error(`Variable ${name} ya definida`)
    }
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
    this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
    this.variables[name] = this.variableIndex
    this.variableIndex++ // Aumentar el índice para la siguiente variable
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
    this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
    this.variables[name] = this.variableIndex
    this.variableIndex++ // Aumentar el índice para la siguiente variable
    return value
  }

  visitLambdaExpr (ctx) {
    const funcID = this.generateFunctionID()
    const params = ctx.paramList()
      ? ctx.paramList().identifier().map(id => id.getText())
      : []
    this.functions.push({
      funcID,
      params,
      body: ctx.expression() || ctx.letInExpr() //  Cuerpo de la función
    })
    this.emit(`LDF ${funcID}`)
    const body = ctx.expression() || ctx.letInExpr()
    const self = this
    const oldEnv = self.environment
    const func = function () {
      const newEnv = Object.assign({}, oldEnv)
      for (let i = 0; i < arguments.length; i++) {
        newEnv[params[i]] = arguments[i]
      }

      self.environment = newEnv
      // let result
      if (body) {
        if (ctx.letInExpr()) {
          // result = self.visit(ctx.letInExpr())
        } else {
          // result = self.visit(body)
        }
        self.environment = oldEnv
      }
    }
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
    this.emit('BF 2')
    let result
    // if (condition) { result = this.visit(ctx.expression(1)) } else { result = this.visit(ctx.expression(2)) }
    const ifThen = this.visit(ctx.expression(1))
    this.emit('BR 1')
    const ifElse = result = this.visit(ctx.expression(2))
    if (condition) result = ifThen
    else result = ifElse
    return result
  }

  visitListExpr (ctx) {
    const elements = ctx.expression().map(expr => this.visit(expr))
    const top = this.facts[this.facts.length - 1]
    if (top.type !== 'arrayAccess' && !Array.isArray(this.environment[this.facts[this.facts.length - 2].name])) {
      this.facts.push({ type: 'list', elements })
      // Realiza pop() n veces
      for (let i = 0; i < elements.length; i++) {
        this.instructions.pop()
      }
      for (let i = 0; i < elements.length; i++) {
        const elem = elements[i]
        const isNumber = typeof elem === 'number'
        const isBoolean = elem === true || elem === false
        const isUndefinedVariable = this.variables[elem] === undefined

        if (!isNumber && !isBoolean && isUndefinedVariable) {
          elements[i] = `"${elem}"`
        }
      }
      this.emit(`LDV [${elements}]`)
    } else { this.emit('LTK') }
    return elements
  }

  visitArrayAccess (ctx) {
    const arrayName = ctx.IDENTIFIER().getText()
    this.emit(`BLD 0 ${this.variables[arrayName]}`)
    const index = this.visit(ctx.expression())
    const array = this.environment[arrayName]
    if (!Array.isArray(array)) {
      throw new Error(`Se intentó acceder a '${arrayName}' que no es un array`)
    }
    if (typeof index !== 'number' || index < 0 || index >= array.length) {
      throw new Error(`Índice fuera de rango: ${index} para el array '${arrayName}'`)
    }

    const value = array[index]
    this.emit('LTK')

    this.facts.push({ type: 'arrayAccess', arrayName, index, value })

    return value
  }

  writeToFile (filename) {
    const basmContent = this.instructions.join('\n')
    fs.writeFileSync(filename, basmContent, 'utf8')
    console.log(`.basm file generated: ${filename}`)
  }
}
