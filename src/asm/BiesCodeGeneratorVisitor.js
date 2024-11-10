import BiesVMVisitor from '../asm/grammar/.antlr/BiesCVisitor.js'
import fs from 'fs'

export default class BiesCodeGeneratorVisitor extends BiesVMVisitor {
  constructor () {
    super()
    this.instructions = []
    this.labelCount = 0
    this.functionCount = 0
    this.environment = {} // Para almacenar las variables y sus índices
    this.types = {}
    this.variableIndex = 0 // Contador para variables
    this.functions = [] // Para almacenar las funciones definidas
  }

  // Al final del procesamiento, escribe todas las funciones
  writeFunctions () {
    this.functions.forEach(func => {
      this.emit(`$FUN ${func.funcID} args:${func.params.length} parent:$0`)

      // Emitir el código para los parámetros
      func.params.forEach((param, index) => {
        this.emit(`BLD 0 ${index} ; ${param} = [${index}]`)
      })

      // Procesar el cuerpo de la función
      this.visit(func.body)
      this.emit('RET')
      this.emit('$END')
    })
  }

  generateLabel (prefix = 'L') {
    return `${prefix}${this.labelCount++}`
  }

  generateFunctionID () {
    this.functionCount++
    return `$${this.functionCount}`
  }

  emit (instruction) {
    this.instructions.push(instruction)
  }

  visitProgram (ctx) {
    this.emit('; Authors:')
    this.emit('; Raquel Alfaro Barrantes, Carlos González Garita')
    this.emit('; Samuel Alfaro Rodríguez, Isaac Felipe Brenes Calderón')

    this.emit('$FUN $0 args:0 parent:$0')
    this.visitChildren(ctx) // Visita todos los hijos del programa
    this.emit('HLT') // Fin del programa principal
    this.emit('$END')

    // Ahora, escribe todas las funciones después del procesamiento principal
    this.writeFunctions()

    return this.instructions
  }

  visitStatement (ctx) {
    return this.visitChildren(ctx)
  }

  visitLetStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = ctx.expression().getText()
    this.visit(ctx.expression())
    if (value.startsWith('() =>')) {
      // Si es una función
      this.emit(`BST 0 ${this.variableIndex} ; ${name} = $${this.variableIndex}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'let'
    } else {
      // Si es una variable normal
      // this.emit(`LDV ${value}`)
      this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'let'
    }

    return null
  }

  visitVarStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = ctx.expression().getText()
    this.visit(ctx.expression())
    if (value.startsWith('() =>')) {
      // Si es una función
      this.emit(`BST 0 ${this.variableIndex} ; ${name} = $${this.variableIndex}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'var'
    } else {
      // Si es una variable normal
      // this.emit(`LDV ${value}`)
      this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'var'
    }
    return null
  }

  visitConstStatement (ctx) {
    const name = ctx.identifier().getText()
    const value = ctx.expression().getText()
    this.visit(ctx.expression())
    if (value.startsWith('() =>')) {
      // Si es una función
      this.emit(`BST 0 ${this.variableIndex} ; ${name} = $${this.variableIndex}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'const'
    } else {
      // Si es una variable normal
      // this.emit(`LDV ${value}`)
      this.emit(`BST 0 ${this.variableIndex} ; ${name}`)
      this.environment[name] = this.variableIndex
      this.variableIndex++ // Aumentar el índice para la siguiente variable
      this.types[name] = 'const'
    }
    return null
  }

  visitLetInExpr (ctx) {
    // Crear un nuevo entorno anidado para el scope de let-in
    const newScope = { ...this.environment }
    const originalEnvironment = this.environment
    this.environment = newScope

    // Procesar todas las declaraciones dentro de `let {...}`
    const statements = ctx.constStatement() || ctx.varStatement()
    if (statements) {
      for (const stmt of statements) {
        this.visit(stmt) // Procesa cada declaración de const o var en el nuevo entorno
      }
    }

    // Generar y aplicar el "lambda" que contiene el bloque in {...}
    const result = this.visit(ctx.expression())

    // Restaurar el entorno original tras evaluar `let-in`
    this.environment = originalEnvironment
    return result
  }

  visitLambdaExpr (ctx) {
    // Genera un ID único para la función
    const funcID = this.generateFunctionID()
    const params = ctx.paramList() ? ctx.paramList().identifier().map(id => id.getText()) : []

    // Almacena la función en una lista temporal de funciones
    this.functions.push({
      funcID,
      params,
      body: ctx.expression() // Cuerpo de la función
    })

    this.emit(`LDF ${funcID}`)
    // Luego de procesar todo el código, emitimos la declaración de la función
    return funcID // Regresa el ID para futuras referencias (como en las llamadas a funciones)
  }

  processArguments (argsText) {
    const args = []
    let currentArg = ''
    let insideQuote = false
    let insideBracket = false
    let quoteChar = '' // Para saber si estamos dentro de comillas dobles o simples

    // Recorre cada carácter de los argumentos
    for (let i = 0; i < argsText.length; i++) {
      const char = argsText[i]

      // Si encontramos una comilla (doble o simple) y no estamos en un bloque de lista
      if ((char === '"' || char === "'") && !insideQuote && !insideBracket) {
        insideQuote = true
        quoteChar = char // Establece si estamos dentro de comillas dobles o simples
        currentArg += char // Añadimos la comilla al argumento
      } else if (char === quoteChar && insideQuote) {
        // Si encontramos la misma comilla de cierre, terminamos el argumento entre comillas
        insideQuote = false
        currentArg += char // Añadimos la comilla de cierre al argumento
        args.push(currentArg)
        currentArg = '' // Reinicia el argumento
      } else if (insideQuote) {
        // Si estamos dentro de comillas, agregamos los caracteres al argumento
        currentArg += char
      } else if (char === '[' && !insideBracket) {
        // Si encontramos un corchete de apertura y no estamos dentro de otro, iniciamos un bloque de lista
        insideBracket = true
        currentArg += char
      } else if (char === ']' && insideBracket) {
        // Si encontramos el corchete de cierre y estamos dentro de un bloque de lista, lo cerramos
        insideBracket = false
        currentArg += char
        args.push(currentArg)
        currentArg = '' // Reinicia el argumento
      } else if (insideBracket) {
        // Si estamos dentro de un bloque de lista, agregamos todos los caracteres al argumento
        currentArg += char
      } else if (char !== ' ' && char !== ',') {
        // Si no estamos dentro de comillas ni de un bloque de lista, agregamos caracteres fuera de comillas
        currentArg += char
      } else if (char === ' ' || char === ',') {
        // Si encontramos un espacio o coma fuera de comillas y bloques, guardamos el argumento actual
        if (currentArg) {
          args.push(currentArg)
          currentArg = '' // Reinicia el argumento
        }
      }
    }

    // Si el último argumento no ha sido guardado, lo añadimos
    if (currentArg) {
      args.push(currentArg)
    }

    return args
  }

  printArgs (args) {
    args.forEach(arg => {
    // Si el argumento es una cadena (entre comillas dobles o simples)
      if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
        const formattedArg = arg.replace(/^["'](.*)["']$/, "'$1'")
        this.emit(`LDV ${formattedArg}`)
      } else {
        this.emit(`LDV ${arg}`)
      }
    })
  }

  visitFunctionCall (ctx) {
    const argsText = ctx.getChild(1).getText() // Obtiene el texto de los argumentos
    let args = []
    if (argsText !== ')') {
      // Llamamos al nuevo método para procesar los argumentos
      args = this.processArguments(argsText)
    }
    // Obtenemos el nombre de la función desde el contexto padre
    const parentNode = ctx.parentCtx
    const funcName = parentNode ? parentNode.getChild(0).getText() : null
    const funcIndex = this.environment[funcName]

    // Dependiendo de la función, emitimos instrucciones
    if (funcName === 'print') {
      this.printArgs(args)
      this.emit('PRN') // Instrucción para imprimir
    } else if (funcName === 'int') {
      this.printArgs(args)
      this.emit('CST \'int\' ')
      this.emit('PRN')
    } else if (funcName === 'len') {
      // Para la función `len`, verificamos si el argumento es un String
      const arg = args[0] // Tomamos el primer argumento (esperamos solo un argumento para `len`)

      if (arg.startsWith('"') && arg.endsWith('"')) {
        // Si el argumento es un String (entre comillas dobles o simples), calculamos la longitud
        const strLength = arg.length - 2 // Restamos 2 para excluir las comillas
        this.emit(`LDV ${strLength}`) // Emite la longitud del String
        this.emit('PRN')
      } else {
        // Si el argumento no es un String, generamos un error o manejamos de otra manera
        throw new Error(`len function requires a String argument, but received: ${arg}`)
      }
    } else if (funcName === 'str') {
      const arg = args[0]

      if (arg.startsWith('[') && arg.endsWith(']')) {
        // Si el argumento es una lista (se asume formato [1,2,3]), lo procesamos
        const elements = arg.slice(1, -1).split(',').map(el => el.trim()) // Eliminamos los corchetes y separamos por comas
        const joinedElements = elements.join(',') // Convertimos a una cadena separada por comas
        this.emit(`LDV '${joinedElements}'`) // Emitimos la cadena como un solo argumento
        this.emit('PRN')
      } else {
        // Si el argumento no es una lista, generamos un error o manejamos de otra manera
        throw new Error(`str function requires a list argument, but received: ${arg}`)
      }
    } else if (funcName === 'bool') {
      // Para la función `bool`, verificamos si el argumento se considera verdadero o falso
      const arg = args[0]
      const isTruthy = arg !== '0' && arg !== 'false' && arg !== 'null' && arg !== '' && arg !== 'undefined'

      this.emit(`LDV ${isTruthy ? 'true' : 'false'}`)
      this.emit('PRN')
    } else {
      this.printArgs(args)
      this.emit(`BLD 0 ${funcIndex}`) // Cargar la función
      this.emit('APP') // Llamar a la función
    }
    return null
  }

  visitLiteral (ctx) {
    if (ctx.STRING_LITERAL()) {
      const strValue = ctx.STRING_LITERAL().getText()
      this.emit(`LDV ${strValue}`)
    } else if (ctx.NUMBER_LITERAL()) {
      const numValue = parseFloat(ctx.NUMBER_LITERAL().getText())
      this.emit(`LDV ${numValue}`)
    }
    return null
  }

  visitPrintStatement (ctx) {
    this.visit(ctx.expression())
    this.emit('PRN')
    return null
  }
  /*
  visitIfThenElseExpr (ctx) {
    const condition = ctx.expression(0)
    const thenBranch = ctx.expression(1)
    const elseBranch = ctx.expression(2)

    const labelThen = this.generateLabel('then')
    const labelEnd = this.generateLabel('end')

    this.visit(condition)
    this.emit(`JZ ${labelEnd}`)

    this.visit(thenBranch)
    this.emit(`JMP ${labelEnd}`)

    this.emit(`${labelEnd}:`)
    this.visit(elseBranch)

    return null
  } */

  // Arithmetic Expressions (addition, subtraction)
  visitAdditiveExpr (ctx) {
    this.visit(ctx.multiplicativeExpr(0))
    for (let i = 1; i < ctx.multiplicativeExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      this.visit(ctx.multiplicativeExpr(i))
      this.emit(operator === '+' ? 'ADD' : 'SUB')
    }
    return null
  }

  visitMultiplicativeExpr (ctx) {
    this.visit(ctx.powerExpr(0))
    for (let i = 1; i < ctx.powerExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText()
      this.visit(ctx.powerExpr(i))
      this.emit(operator === '*' ? 'MUL' : 'DIV')
    }
    return null
  }

  /* visitPowerExpr (ctx) {
    // Primero, procesamos la primera expresión unaria (lado izquierdo de la potencia)
    const base = this.visit(ctx.unaryExpr(0)) // El valor de base (x en x ** y)

    // Procesamos el exponente (y en x ** y)
    const exponent = ctx.powerExpr() // El exponente (y)

    // Empezamos el proceso de potencia: x ** y
    const labelLoop = this.generateLabel('loop')
    const result = this.generateLabel('result') // Aquí almacenaremos el resultado

    // Inicializamos el acumulativo
    this.emit('LDV 1') // Inicializamos resultado = 1
    this.emit(`BST 0 ${this.variableIndex++}`) // Colocamos en la pila el resultado

    // Inicializamos el contador (variable de loop) y el resultado
    this.emit('LDV 0') // Inicializamos resultado = 1
    this.emit(`BST 0 ${this.variableIndex++}`) // Colocamos en la pila el resultado

    // Inicializamos el contador de repeticiones (exponente)
    this.emit(`LDV ${exponent}`)
    this.emit(`BST 0 ${this.variableIndex++}`) // Lo colocamos en la pila como contador

    this.emit(`; ${labelLoop}:`) // Inicia el ciclo de multiplicación

    // Verificamos si el contador = exponente
    this.emit(`BLD 0 ${this.variableIndex - 2}`) // Cargamos el contador
    this.emit(`BLD 0 ${this.variableIndex - 1}`)
    this.emit('EQQ') // Verificamos si el contador es 0
    this.emit('BT +8') // Si es 0, terminamos el ciclo

    this.emit(`BLD 0 ${this.variableIndex - 3}`) // Cargamos el acumulado
    this.emit(`LDV ${base}`) // Cargamos el acumulado
    this.emit('MUL')

    // Disminuimos el contador
    this.emit('LDV 1') // Cargamos el contador
    this.emit(`BLD 0 ${this.variableIndex - 2}`) // Cargamos el contador
    this.emit('ADD') // Restamos 1
    this.emit(`BST 0 ${this.variableIndex - 3}`) // Cargamos el acumulado
    this.emit('BR -11')

    return result // El resultado estará en la cima de la pila
  } */

  visitPrimaryExpr (ctx) {
    return this.visitChildren(ctx)
  }

  visitArgumentList (ctx) {
    return this.visitChildren(ctx)
  }

  writeToFile (filename = 'output.basm') {
    const basmContent = this.instructions.join('\n')
    fs.writeFileSync(filename, basmContent, 'utf8')
    console.log(`.basm file generated: ${filename}`)
  }
}
