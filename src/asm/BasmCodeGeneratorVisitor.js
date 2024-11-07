// BasmCodeGeneratorVisitor.js
import BiesCVisitor from '../asm/grammar/.antlr/BiesCVisitor.js';
import fs from 'fs';

export default class BasmCodeGeneratorVisitor extends BiesCVisitor {
  constructor() {
    super();
    this.instructions = [];
    this.labelCount = 0;
    this.currentFunction = null;
  }

  // Helper to generate unique labels
  generateLabel(prefix = 'L') {
    return `${prefix}${this.labelCount++}`;
  }

  // Helper to emit an instruction
  emit(instruction) {
    this.instructions.push(instruction);
  }

  // Main entry to visit the program node
  visitProgram(ctx) {
    this.emit('; Begin Program');
    this.visitChildren(ctx);
    this.emit('HLT'); // End of program
    return this.instructions;
  }

  // Visit variable declarations (let, const, var)
  visitLetStatement(ctx) {
    const varName = ctx.identifier().getText();
    this.visit(ctx.expression()); // Evaluate the expression
    this.emit(`LDV ${varName}`); // Store variable in environment
    return null;
  }

  visitConstStatement(ctx) {
    const varName = ctx.identifier().getText();
    this.visit(ctx.expression());
    this.emit(`LDV ${varName} ; const`);
    return null;
  }

  // Arithmetic operations
  visitAdditiveExpr(ctx) {
    this.visit(ctx.multiplicativeExpr(0));
    for (let i = 1; i < ctx.multiplicativeExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText();
      this.visit(ctx.multiplicativeExpr(i));
      if (operator === '+') {
        this.emit('ADD');
      } else if (operator === '-') {
        this.emit('SUB');
      }
    }
    return null;
  }

  visitMultiplicativeExpr(ctx) {
    this.visit(ctx.powerExpr(0));
    for (let i = 1; i < ctx.powerExpr().length; i++) {
      const operator = ctx.getChild(2 * i - 1).getText();
      this.visit(ctx.powerExpr(i));
      if (operator === '*') {
        this.emit('MUL');
      } else if (operator === '/') {
        this.emit('DIV');
      }
    }
    return null;
  }

  // Boolean and Comparison Expressions
  visitLogicalAndExpr(ctx) {
    this.visit(ctx.equalityExpr(0));
    for (let i = 1; i < ctx.equalityExpr().length; i++) {
      this.visit(ctx.equalityExpr(i));
      this.emit('AND');
    }
    return null;
  }

  visitEqualityExpr(ctx) {
    this.visit(ctx.relationalExpr(0));

    // Ensure that the operator exists before accessing it
    const operatorNode = ctx.getChild(1);
    if (!operatorNode) {
      console.error("Error: Missing operator in equality expression.");
      return null;  // Skip or handle this case as appropriate
    }

    const operator = operatorNode.getText();
    this.visit(ctx.relationalExpr(1));

    // Emit the corresponding instruction based on the operator
    this.emit(operator === '==' ? 'EQ' : 'EQQ');
    return null;
  }

  // Function Definition
  visitFunDeclaration(ctx) {
    const funcName = ctx.identifier().getText();
    const params = ctx.paramList() ? ctx.paramList().identifier().map(id => id.getText()) : [];
    const endLabel = this.generateLabel('END_FUNC');

    this.emit(`$FUN ${funcName} args: ${params.length} parent: global`);
    params.forEach((param, index) => {
      this.emit(`LDV ${param} ; param`);
    });

    this.currentFunction = funcName;
    this.visit(ctx.expression());
    this.emit(`RET`);
    this.emit(`$END ; end function ${funcName}`);
    this.currentFunction = null;
    return null;
  }

  // Conditional (if-then-else)
  visitIfThenElseExpr(ctx) {
    const elseLabel = this.generateLabel('ELSE');
    const endLabel = this.generateLabel('ENDIF');

    this.visit(ctx.expression(0)); // Condition
    this.emit(`BF ${elseLabel}`); // Branch if false

    this.visit(ctx.expression(1)); // Then branch
    this.emit(`BR ${endLabel}`);   // Jump to end

    this.emit(`${elseLabel}:`);
    this.visit(ctx.expression(2)); // Else branch

    this.emit(`${endLabel}:`);
    return null;
  }

  // Loop (for example, a while loop)
  visitWhileLoop(ctx) {
    const startLabel = this.generateLabel('WHILE_START');
    const endLabel = this.generateLabel('WHILE_END');

    this.emit(`${startLabel}:`);
    this.visit(ctx.condition());
    this.emit(`BF ${endLabel}`); // Exit if condition is false
    this.visit(ctx.body());
    this.emit(`BR ${startLabel}`); // Repeat loop
    this.emit(`${endLabel}:`);
    return null;
  }

  // Emit output and input
  visitPrintStatement(ctx) {
    this.visit(ctx.expression());
    this.emit(`PRN`);
    return null;
  }

  visitInputStatement(ctx) {
    this.emit(`INP`);
    this.emit(`STK ${ctx.identifier().getText()}`);
    return null;
  }

  // Save instructions to file
  writeToFile(filename = 'output.basm') {
    const basmContent = this.instructions.join('\n');
    fs.writeFileSync(filename, basmContent, 'utf8');
    console.log(`.basm file generated: ${filename}`);
  }
}
