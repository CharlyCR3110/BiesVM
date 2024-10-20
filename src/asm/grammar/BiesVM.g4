grammar BiesVM; // generada por ChatGPT

// Programa
program: statement* EOF;

// Instrucciones o declaraciones
statement
    : letDeclaration        // Declaraciones let/var
    | funDeclaration        // Declaraciones de funciones
    | expressionStatement   // Expresiones
    ;

// Declaraciones de let/var
letDeclaration
    : LET variableDeclarationBlock 'in' expressionBlock
    | LET variableDeclaration
    ;

variableDeclarationBlock
    : '{' variableDeclaration* '}'
    ;

variableDeclaration
    : CONST IDENTIFIER '=' expression       // Constantes
    | VAR IDENTIFIER '=' expression         // Variables
    ;

// Declaraciones de funciones
funDeclaration
    : FUN IDENTIFIER '(' parameterList? ')' '=>' expression
    ;

parameterList
    : IDENTIFIER (',' IDENTIFIER)*
    ;

// Expresiones
expressionStatement
    : expression
    ;

expression
    : assignmentExpression                 // Expresiones de asignación
    | logicalOrExpression                  // Expresiones lógicas
    ;

assignmentExpression
    : IDENTIFIER '=' expression            // Asignación de valor
    | logicalOrExpression
    ;

logicalOrExpression
    : logicalAndExpression ('||' logicalAndExpression)*
    ;

logicalAndExpression
    : equalityExpression ('&&' equalityExpression)*
    ;

equalityExpression
    : relationalExpression (('==' | '!=') relationalExpression)*
    ;

relationalExpression
    : additiveExpression (('>' | '>=' | '<' | '<=') additiveExpression)*
    ;

additiveExpression
    : multiplicativeExpression (('+' | '-') multiplicativeExpression)*
    ;

multiplicativeExpression
    : unaryExpression (('*' | '/' | '**') unaryExpression)*
    ;

unaryExpression
    : ('!' | '-' | '+') unaryExpression
    | primaryExpression
    ;

// Expresiones primarias (números, hileras, llamadas a funciones, listas, lambdas)
primaryExpression
    : NUMBER
    | STRING
    | BOOLEAN
    | IDENTIFIER                          // Identificadores (variables o funciones)
    | lambdaExpression                    // Lambdas
    | listExpression                      // Listas
    | '(' expression ')'                  // Subexpresiones
    | functionCall                        // Llamadas a funciones
    ;

// Expresiones de listas
listExpression
    : '[' expressionList? ']'
    ;

expressionList
    : expression (',' expression)*
    ;

// Lambdas
lambdaExpression
    : '(' parameterList? ')' '=>' expression
    ;

// Llamadas a funciones
functionCall
    : IDENTIFIER '(' argumentList? ')'
    ;

argumentList
    : expression (',' expression)*
    ;

// Bloques de expresiones (secuencia de expresiones)
expressionBlock
    : '{' expression* '}'
    ;

// Tokens
LET: 'let';
CONST: 'const';
VAR: 'var';
FUN: 'fun';
TRUE: 'true';
FALSE: 'false';

NUMBER: [0-9]+;
STRING: '"' .*? '"';
BOOLEAN: TRUE | FALSE;

IDENTIFIER: [a-zA-Z_][a-zA-Z0-9_]*;

COMMENT: '//' ~[\r\n]* -> skip;
WHITESPACE: [ \t\r\n]+ -> skip;
