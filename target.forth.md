# Target Forth word set

## Memory

    @ ( addr -- n )
    ! ( x addr -- )

## Arithmetic

    + - * / and or xor lshift rshift ( a b -- c )
    invert negate ( a -- b )

## Comparison

    = < > <= >= ( a b -- c )

## Control flow

    begin until while repeat if else then

## Stack manipulations

    drop swap dup over pick

## Literals

## Definitions

    : name ... ;
    create Name
    value Name
