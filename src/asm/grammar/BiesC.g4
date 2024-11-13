grammar BiesC;

// Punto de entrada del programa
program
    : statement* EOF
    ;

// Declaraciones principales
statement
    : letStatement
    | constStatement
    | varStatement
    | funDeclaration
    | expressionStatement
    | letInExpr
    | ifThenElseExpr
    ;

// Declaraciones de variables
letStatement
    : 'let' identifier '=' expression
    ;

constStatement
    : 'const' identifier '=' expression
    ;

varStatement
    : 'var' identifier '=' expression
    ;

// Declaración de funciones
funDeclaration
    : 'fun' identifier '(' paramList? ')' '=>' expression
    ;

// Expresión individual
expressionStatement
    : expression
    ;

// Expresiones con precedencia
expression
    : logicalOrExpr
    ;

logicalOrExpr
    : logicalAndExpr ('||' logicalAndExpr)*
    ;

logicalAndExpr
    : equalityExpr ('&&' equalityExpr)*
    ;

equalityExpr
    : relationalExpr (('==' | '!=') relationalExpr)*
    ;

relationalExpr
    : additiveExpr (('>' | '>=' | '<' | '<=') additiveExpr)*
    ;

additiveExpr
    : multiplicativeExpr (('+' | '-') multiplicativeExpr)*
    ;

multiplicativeExpr
    : powerExpr (('*' | '/') powerExpr)*
    ;

powerExpr
    : unaryExpr ('**' powerExpr)*
    ;

unaryExpr
    : ('!' | '-') unaryExpr
    | postfixExpr
    ;

postfixExpr
    : primaryExpr postfixOp*
    ;

postfixOp
    : '(' argumentList? ')'    
    ;

argumentList
    : expression (',' expression)*
    ;

// Expresiones principales
primaryExpr
    : identifier
    | literal
    | '(' expression ')'
    | lambdaExpr
    | listExpr
    | blockExpr
    | ifThenElseExpr
    | letStatement
    ;

// Lambdas anónimas
lambdaExpr
    //: '(' paramList? ')' '=>' (expression | letInExpr)
    //: '(' paramList? ')' '=>' (lambdaExpr | expression | letInExpr)
    : '(' paramList? ')' '=>' (lambdaExpr | expression | letInExpr)  
    ;

// Expresión 'let-in'
letInExpr
    : 'let' '{' (constStatement | letStatement | varStatement | funDeclaration)* '}' 'in' '{'? expression * '}'?
    ;

// Bloque de expresiones
blockExpr
    : '{' (expression (',' expression)*)? '}'
    ;

// Expresión condicional
ifThenElseExpr
    : 'if' '('expression')' 'then' expression 'else' expression
    ;

// Expresión de lista
listExpr
    : '[' (expression (',' expression)*)? ']'
    ;

// Parámetros de funciones
paramList
    : identifier (',' identifier)*
    ;

// Literales y tokens
literal
    : BOOL_LITERAL
    | STRING_LITERAL
    | NUMBER_LITERAL
    ;

BOOL_LITERAL
    : 'true' | 'false'
    ;

STRING_LITERAL
    : '"' (~["\r\n])* '"'
    ;

NUMBER_LITERAL
    : [0-9]+ ('.' [0-9]+)?
    ;

// Identificadores
identifier
    : IDENTIFIER
    ;

IDENTIFIER
    : [a-zA-Z_][a-zA-Z0-9_]*
    ;

// Comentarios y espacios en blanco
COMMENT
    : '//' ~[\r\n]* -> skip
    ;

WS
    : [ \t\r\n]+ -> skip
    ;
