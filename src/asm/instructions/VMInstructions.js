// VMInstructions.js
import Stack from './Stack'

class VMInstructions {
  constructor () {
    this.stack = new Stack()
    this.variables = new Map()
  }

  // Apilar un número en la pila
  pushNumber (value) {
    this.stack.push(Number(value))
  }

  // Apilar una cadena en la pila
  pushString (value) {
    this.stack.push(value.slice(1, -1)) // Eliminar comillas
  }

  // Apilar un booleano en la pila
  pushBoolean (value) {
    this.stack.push(value === 'true')
  }

  // Cargar una variable en la pila
  loadVariable (name) {
    if (this.variables.has(name)) {
      this.stack.push(this.variables.get(name))
    } else {
      throw new Error(`Variable ${name} no definida`)
    }
  }

  // Almacenar un valor en una variable
  storeVariable (name) {
    const value = this.stack.pop()
    this.variables.set(name, value)
  }

  // Crear una lista con elementos
  createList (items) {
    this.stack.push(items)
  }

  // Llamar a una función
  callFunction (name, args) {
    // Aquí puedes implementar la lógica para llamar a funciones
    console.log(`Llamando a la función: ${name} con argumentos:`, args)
  }

  // Operaciones aritméticas
  add () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left + right
    this.stack.push(result)
    return result
  }

  subtract () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left - right
    this.stack.push(result)
    return result
  }

  multiply () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left * right
    this.stack.push(result)
    return result
  }

  divide () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    if (right === 0) {
      throw new Error('División por cero')
    }
    const result = left / right
    this.stack.push(result)
    return result
  }

  // Operaciones lógicas
  logicalOr () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left || right
    this.stack.push(result)
    return result
  }

  logicalAnd () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left && right
    this.stack.push(result)
    return result
  }

  equal () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left === right
    this.stack.push(result)
    return result
  }

  notEqual () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left !== right
    this.stack.push(result)
    return result
  }

  lessThan () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left < right
    this.stack.push(result)
    return result
  }

  greaterThan () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left > right
    this.stack.push(result)
    return result
  }

  lessThanOrEqual () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left <= right
    this.stack.push(result)
    return result
  }

  greaterThanOrEqual () {
    const right = this.stack.pop()
    const left = this.stack.pop()
    const result = left >= right
    this.stack.push(result)
    return result
  }

  // Negar un valor
  negate () {
    const value = this.stack.pop()
    const result = -value
    this.stack.push(result)
    return result
  }

  // Negación lógica
  not () {
    const value = this.stack.pop()
    const result = !value
    this.stack.push(result)
    return result
  }

  // Obtener el valor superior de la pila
  pop () {
    return this.stack.pop()
  }

  // Ver el valor superior de la pila sin eliminarlo
  peek () {
    return this.stack.peek()
  }
}

export default new VMInstructions()
