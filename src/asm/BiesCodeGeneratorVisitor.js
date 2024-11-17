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
  /**
   * Default constructor for initializing the internal state of the object.
   * This constructor sets up various counters, lists, and maps used for managing
   * functions, variables, instructions, and the execution environment.
   */
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
  /**
   * A generator function that iterates through all facts stored in the `facts` list.
   * Each fact is yielded one by one.
   */
  * factsGenerator () {
    for (const fact of this.facts) {
      yield fact
    }
  }
  /**
   * Emits an instruction by appending it to the `instructions` list.
   * 
   * @param {string} instruction - The instruction to be added to the list.
   */
  emit (instruction) {
    this.instructions.push(instruction)
  }

  /**
   * Processes a literal node from the provided context and generates the appropriate fact and instruction.
   * 
   * The function determines the type of literal (boolean, string, or number) and extracts its value.
   * It adds the literal to the `facts` list and generates a corresponding load instruction, which is
   * either a load value (`LDV`) or a load variable (`BLD`) based on the existence of the value in the
   * `variables` map.
   * 
   * @param {Object} ctx - The context containing the literal to be processed.
   * @returns {string|number|boolean} The extracted literal value.
   */
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

  /**
   * Writes all defined functions by emitting their declarations, processing their parameters,
   * and handling their body instructions.
   * 
   * For each function, the method:
   * - Emits the function declaration with its ID and number of parameters.
   * - Saves the parameters in the environment and variable map with their corresponding indices.
   * - Processes the function body.
   * - Emits the `RET` instruction to indicate a function return.
   * - Emits `$END` to mark the end of the function declaration.
   */
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

  /**
   * Generates a unique function ID by incrementing the function count.
   * 
   * @returns {string} A unique ID for the function in the format `$<count>`.
   */
  generateFunctionID () {
    this.functionCount++
    return `$${this.functionCount}`
  }

  /**
   * Processes an identifier from the provided context and performs various actions
   * based on the identifier's name. It handles variable resolution, special function calls,
   * and emits the appropriate instructions.
   * 
   * @param {Object} ctx - The context containing the identifier to process.
   * @returns {any} The resolved value or function associated with the identifier.
   * @throws {Error} If the identifier is not defined or cannot be resolved.
   */
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

  /**
   * Processes a primary expression by delegating to the appropriate handler based on the type
   * of expression. The method iterates through a list of conditions and their corresponding
   * handlers, executing the handler for the first matching condition.
   * 
   * Supported primary expressions include:
   * - Identifiers
   * - Literals
   * - Expressions
   * - Lambda expressions
   * - Let statements
   * - If-then-else expressions
   * - List expressions
   * - Array access
   * 
   * @param {Object} ctx - The context representing the primary expression.
   * @returns {any} The result of the handler for the matched expression type.
   * @throws {Error} If the primary expression type is not supported.
   */
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

  /**
   * Processes a postfix expression by visiting the primary expression first,
   * then applying a series of postfix operations sequentially.
   * 
   * @param {Object} ctx - The context representing the postfix expression.
   * @returns {any} The result of applying all postfix operations.
   */
  visitPostfixExpr (ctx) {
    let result = this.visit(ctx.primaryExpr())
    const postfixOps = ctx.postfixOp()
    for (const op of postfixOps) {
      result = this.visitPostfixOp(op, result)
    }
    return result
  }

  /**
   * Handles a single postfix operation. If the operation includes an argument list, it validates
   * and applies the function call with the provided arguments. Otherwise, it treats the function
   * as a no-argument callable.
   * 
   * @param {Object} ctx - The context representing the postfix operation.
   * @param {Function|string} func - The function or value to which the operation is applied.
   * @returns {any} The result of the operation.
   * @throws {Error} If the operation attempts to call a non-function value.
   */
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

  /**
   * Visits an argument list, evaluating each argument expression and emitting
   * the appropriate instruction based on the function call type.
   * 
   * @param {Object} ctx - The context representing the argument list.
   * @returns {Array} An array of evaluated arguments.
   */
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

  /**
   * Evaluates a unary expression, supporting negation and logical NOT operations.
   * If the context contains another unary expression, the operation is applied recursively.
   * Otherwise, the method delegates to processing a postfix expression.
   * 
   * @param {Object} ctx - The context representing the unary expression.
   * @returns {any} The result of evaluating the unary expression.
   */
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

  /**
   * Evaluates a power expression, applying exponential operations recursively.
   * Supports chained power operators (**).
   * 
   * @param {Object} ctx - The context representing the power expression.
   * @returns {number} The result of evaluating the power expression.
   */
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

  /**
   * Evaluates a multiplicative expression, processing multiplication (*) and division (/).
   * Operates sequentially on all terms in the expression.
   * 
   * @param {Object} ctx - The context representing the multiplicative expression.
   * @returns {number} The result of evaluating the multiplicative expression.
   */
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

  /**
   * Evaluates an additive expression, supporting addition (+) and subtraction (-).
   * Concatenation is supported for string operands.
   * 
   * @param {Object} ctx - The context representing the additive expression.
   * @returns {number|string} The result of evaluating the additive expression.
   */
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

  /**
   * Evaluates a relational expression, supporting operators such as >, >=, <, and <=.
   * The evaluation proceeds sequentially for all terms in the expression.
   * 
   * @param {Object} ctx - The context representing the relational expression.
   * @returns {boolean} The result of evaluating the relational expression.
   */
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

  /**
   * Evaluates an equality expression, supporting operators such as == and !=.
   * Handles type coercion for equality checks.
   * 
   * @param {Object} ctx - The context representing the equality expression.
   * @returns {boolean} The result of evaluating the equality expression.
   */
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

  /**
   * Evaluates a logical AND expression by iterating through equality expressions
   * and combining their results with the logical AND operator.
   *
   * @param ctx The context containing the logical AND expression.
   * @return The boolean result of the logical AND operation.
   */
  visitLogicalAndExpr (ctx) {
    let result = this.visit(ctx.equalityExpr(0))
    for (let i = 1; i < ctx.equalityExpr().length; i++) {
      result = result && this.visit(ctx.equalityExpr(i))
      this.emit('AND')
    }
    return result
  }

  /**
   * Evaluates a logical OR expression by iterating through logical AND expressions
   * and combining their results with the logical OR operator.
   *
   * @param ctx The context containing the logical OR expression.
   * @return The boolean result of the logical OR operation.
   */
  visitLogicalOrExpr (ctx) {
    let result = this.visit(ctx.logicalAndExpr(0))
    for (let i = 1; i < ctx.logicalAndExpr().length; i++) {
      const visit = this.visit(ctx.logicalAndExpr(i))
      result = result || visit
      this.emit('OR')
    }
    return result
  }

  /**
   * Evaluates a general expression by delegating the evaluation to a logical OR expression.
   *
   * @param ctx The context containing the expression.
   * @return The result of the expression evaluation.
   */
  visitExpression (ctx) {
    return this.visit(ctx.logicalOrExpr())
  }

  /**
   * Processes an expression statement by evaluating the underlying expression.
   *
   * @param ctx The context containing the expression statement.
   * @return The result of the expression evaluation.
   */
  visitExpressionStatement (ctx) {
    return this.visit(ctx.expression())
  }

  /**
   * Evaluates a statement by determining its type and processing it accordingly.
   * Supports multiple types of statements including variable declarations and expressions.
   *
   * @param ctx The context containing the statement.
   * @return The result of the statement execution.
   * @throws Error if the statement type is not supported.
   */
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

  /**
   * Processes a `let` statement, binding a variable name to a value in the environment.
   * Ensures the variable name is unique within the current scope.
   *
   * @param ctx The context containing the `let` statement.
   * @return The value bound to the variable.
   * @throws Error if the variable name or value is undefined, or if the variable already exists.
   */
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

  /**
   * Processes a `const` statement, binding a variable name to a constant value in the environment.
   * Ensures the variable name is unique and cannot be reassigned.
   *
   * @param ctx The context containing the `const` statement.
   * @return The constant value bound to the variable.
   * @throws Error if the variable name already exists.
   */
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

  /**
   * Processes a `var` statement, binding a variable name to a value in the environment.
   * Allows redeclaration of variables with the same name.
   *
   * @param ctx The context containing the `var` statement.
   * @return The value bound to the variable.
   */
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

  /**
   * Processes a lambda expression and generates a callable function.
   * 
   * @param ctx - The context representing the lambda expression in the abstract syntax tree.
   * @returns A function object that encapsulates the lambda's logic.
   */
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

  /**
   * Processes a 'let-in' expression, managing variable declarations within a temporary scope.
   * 
   * @param ctx - The context representing the 'let-in' expression.
   * @returns The result of evaluating the final expression within the 'in' block.
   */
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

  /**
   * Evaluates an 'if-then-else' expression by processing its condition and branches.
   * 
   * @param ctx - The context representing the 'if-then-else' expression.
   * @returns The evaluated result from the appropriate branch.
   */
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

  /**
   * Evaluates a list expression and processes its elements.
   * 
   * @param ctx - The context representing the list expression.
   * @returns An array containing the evaluated elements of the list.
   */
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

  /**
   * Handles array access operations, ensuring bounds and type checks.
   * 
   * @param ctx - The context representing the array access operation.
   * @returns The value at the specified array index.
   * @throws An error if the accessed variable is not an array or the index is out of bounds.
   */
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

  /**
   * Writes the current set of instructions to a .basm file.
   * 
   * @param filename - The name of the file to write the instructions.
   */
  writeToFile (filename) {
    const basmContent = this.instructions.join('\n')
    fs.writeFileSync(filename, basmContent, 'utf8')
    console.log(`.basm file generated: ${filename}`)
  }
}
