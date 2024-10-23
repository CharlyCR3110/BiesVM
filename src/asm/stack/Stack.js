// Stack.js
class Stack {
  constructor () {
    this.items = []
  }

  // Apilar un elemento
  push (item) {
    this.items.push(item)
  }

  // Desapilar un elemento
  pop () {
    if (this.isEmpty()) {
      throw new Error('Pila vacía')
    }
    return this.items.pop()
  }

  // Ver el elemento superior sin desapilar
  peek () {
    if (this.isEmpty()) {
      throw new Error('Pila vacía')
    }
    return this.items[this.items.length - 1]
  }

  // Comprobar si la pila está vacía
  isEmpty () {
    return this.items.length === 0
  }

  // Tamaño de la pila
  size () {
    return this.items.length
  }

  // Vaciar la pila
  clear () {
    this.items = []
  }
}

export default Stack
