grammar BiesVM;

// Programa principal
program
    : (statement | expression)* EOF
    ;

// Declaraciones e instrucciones
statement
    : letDeclaration               // Declaraciones de variables let/var
    | letInDeclaration             //Declaraciones let plano
    | funDeclaration               // Declaraciones de funciones
    | expressionStatement          // Expresiones
    ;

// Declaraciones de let/var
letInDeclaration
    : LET variableDeclarationBlock 'in' expressionBlock
    ;

letDeclaration
    : LET simpleDeclaration
    ;

variableDeclarationBlock
    : '{' variableDeclaration* '}'
    ;

variableDeclaration
    : CONST IDENTIFIER '=' primaryExpression     // Constantes
    | VAR IDENTIFIER '=' primaryExpression       // Variables
    ;

simpleDeclaration
    : IDENTIFIER '=' primaryExpression
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

// Expresiones condicionales if-then-else
conditionalExpression
    : 'if' expression 'then' expression 'else' expression
    ;

// Expresiones de asignación
assignmentExpression
    : IDENTIFIER '=' expression
    | logicalOrExpression
    ;

// Expresiones lógicas
logicalOrExpression
    : logicalAndExpression ('||' logicalAndExpression)*
    ;

logicalAndExpression
    : equalityExpression ('&&' equalityExpression)*
    ;

equalityExpression
    : relationalExpression (('==' | '!=') relationalExpression)*
    ;

// Expresiones relacionales
relationalExpression
    : additiveExpression (('>' | '>=' | '<' | '<=') additiveExpression)*
    ;

// Expresiones aditivas
additiveExpression
    : multiplicativeExpression (('+' | '-') multiplicativeExpression)*
    ;

// Expresiones multiplicativas
multiplicativeExpression
    : unaryExpression (('*' | '/' | '**') unaryExpression)*
    ;

// Expresiones unarias
unaryExpression
    : ('!' | '-' | '+') unaryExpression
    | primaryExpression
    ;

// Expresiones primarias (números, cadenas, llamadas a funciones, listas, lambdas, condicionales)
primaryExpression
    : NUMBER
    | STRING
    | BOOLEAN
    | IDENTIFIER                          // Identificadores (variables o funciones)
    | lambdaExpression                    // Lambdas
    | listExpression                      // Listas
    | conditionalExpression               // Condicionales
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

// Bloques de expresiones (secuencia de expresiones y declaraciones)
expressionBlock
    : '{' (statement | expression)* '}'
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

// Palabras clave de funciones predefinidas
PRINT: 'print';
INPUT: 'input';
INT: 'int';
STR: 'str';
BOOL: 'bool';
LIST: 'list';
LEN: 'len';

IDENTIFIER: [a-zA-Z_][a-zA-Z0-9_]*;

// Comentarios
COMMENT: '//' ~[\r\n]* -> skip;
COMMENT_BLOCK: '/*' .*? '*/' -> skip;

// Espacios en blanco
WHITESPACE: [ \t\r\n]+ -> skip;
