# biesC - A Compiler for the Functional Language BIES

## Introduction

`biesC` is a prototype compiler developed to generate code for the virtual machine `biesVM` as part of an academic project for the BIES language. This compiler is the second phase following the `biesVM` interpreter, completing a two-part system: a stack-based virtual machine (`biesVM`) and a compiler (`biesC`) for the BIES language. `biesC` is designed to parse BIES code, perform syntactic and semantic analysis, and compile it into assembly-like instructions (`biesASM`) compatible with `biesVM`.

## Language Overview

The BIES language is a functional language designed to support operations such as arithmetic, logic, and string and list manipulations. It includes conditional expressions (`if-then-else`), declaration constructs (`let`, `fun`, and `let-in`), and block expressions in sequences (`{ ... }`). Key aspects include:
- **Data Types**: Supports numbers, strings, booleans (`true` and `false`), and lambdas (denoted by `=>` as in JavaScript).
- **Identifiers**: Follow JavaScript naming conventions but cannot begin with `$`. Strings are enclosed in double quotes (`"`), while lists use JavaScript-style array syntax, allowing nesting.
- **Scoping**: Uses nested scopes with constructs such as `let-in` and lambdas, where `let-in` declarations introduce a new, nested scope for the defined variables.

The code in a `.bies` source file is implicitly wrapped within a `main` function, allowing the BIES language to encapsulate code at runtime in the `biesVM` environment.

## Prerequisites

To run this project, ensure you have the following:
- **Node.js** (ES6+)
- **ANTLR4** for parsing the BIES grammar
- **Terminal** to execute commands

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CharlyCR3110/BiesVm.git
   cd BiesC
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the ANTLR grammar:
   ```bash
   npm run antlr
   ```

## Usage

### Compiling a Source File

To compile a BIES source file (`.bies`) into assembly-like instructions (`.biesASM`), use the `biesc` command:

```bash
biesc [options] file.bies
```

*makes sure to have the file in the `input_files` folder.*

#### Command Options

- `--o outfile`: Specifies the output file for the compiled code. If omitted, the output file will take the source filename without its `.bies` extension. 

*This file will be saved in the`output_files` folder.*

  - Example: 
    ```bash
    biesc --o compiledFile.biesASM source.bies
    ```
- `--e errfile`: Specifies a file for logging errors encountered during compilation. If omitted, errors are logged to the console.

*This file will be saved in the `errors` folder.*

  - Example: 
    ```bash
    biesc --e errors.log source.bies
    ```

#### Example Usage

- Basic compilation:
  ```bash
  biesc source.bies
  ```
- Compilation with specific output file:
  ```bash
  biesc --o compiledFile.biesASM source.bies
  ```
- Compilation with error logging:
  ```bash
  biesc --e errors.log source.bies
  ```
- Combining both options:
  ```bash
  biesc --o compiledFile.biesASM --e errors.log source.bies
  ```


## Language Syntax and Examples

Here are examples demonstrating the BIES syntax and functionality:

### Example Code Snippets

```js
let splash = (msg) => print(msg)
let version = 666 - 665
splash("Testing helloworld Version " + version + "***")
print("Hello World!")
```

## Documentation

To generate the project documentation, use:

```bash
npm run doc
```

## Authors

- **Carlos González Garita**
- **Felipe Brenes Calderón**
- **Raquel Alfaro Barrantes**
- **Samuel Alfaro Rodríguez**

