'use strict';

var _ = require('lodash'),
    trav = require('shift-traverse');

function forthOperators (operator) {
    var table = {
        '&&': 'and',
        '||': 'or',
        '<<': 'lshift',
        '>>': 'rshift',
        '~': 'invert',
        // Forth
        '<': '<',
        '>': '>',
        '<=': '> invert',
        '>=': '< invert',
        '==': '=',
        '!==': '<>'
    };
    return table[operator] || operator;
}

// peephole optimizer running over the Forth string
function peephole (newString) {

    // single optimization pass
    function step (str) {
        var f, op2, op2c;

        op2 = '(and|or|xor|lshift|rshift|\\+|\\-|\\*|/|=|<|>|<=|>=)';
        op2c = '(and|or|xor|\\+|\\*|=)'; // commutative

        f = str.match('(.*)1 pick ' + op2 + ' nip(.*)');
        if (f) { return f[1] + 'swap ' + f[2] + f[3]; }

        f = str.match('(.*)1 pick swap ' + op2 + ' nip(.*)');
        if (f) { return f[1] + f[2] + f[3]; }

        f = str.match('(.*)0 pick 2 pick ' + op2 + '(.*)');
        if (f) { return f[1] + '1 pick 1 pick swap ' + f[2] + f[3]; }

        f = str.match('(.*)0 pick 2 pick swap (' + op2 + ')(.*)');
        if (f) { return f[1] + '1 pick 1 pick ' + f[2] + f[3]; }

        f = str.match('(.*)0 pick (\\d+) ' + op2 + ' nip(.*)');
        if (f) { return f[1] + f[2] + ' ' + f[3] + f[4]; }

        f = str.match('(.*)0 pick (\\w+) @ ' + op2 + ' nip(.*)');
        if (f) { return f[1] + f[2] + ' @ ' + f[3] + f[4]; }

        f = str.match('(.*)swap ' + op2c + '(.*)');
        if (f) { return f[1] + f[2] + f[3]; }

        return false; // string can't be optimized
    }

    var oldString;

    do {
        oldString = newString;
        newString = step(oldString);
    } while (newString)
    return oldString;
}

function insertForth (scope, dfg, options) {
    var astNode, stack, stream;

    function stackStatus (init) {
        var arr, ret;

        arr = init.split('\n');
        if (
            options &&
            options.comments &&
            options.comments === true
        ) {
            ret = '';
            stack.forEach(function (e) {
                ret += ' ' + e[0] + ':' + e[1].join(',');
            });

            return _.repeat(' ', 22 - arr[arr.length - 1].length) + ' (' + ret + ' )\n';
        } else {
            return ' ';
        }
    }

    function cleanStackElement () {
        var res, e, tmp; //, i, j;
        res = '';

        if (stack.length === 0) {
            // empty stack case
            return res;
        }

        // all cleaning oprations on the top of stack
        e = stack[stack.length - 1][1];
        if (e.length === 0) {
            // droping useless element
            stack.pop();
            res = 'drop';
            res += stackStatus(res);
            return res;
        }

        if (e.length === 1) {
            // last destination
            if (
                !scope.variableList.some(function (ee) {
                    return ee.name === e[0];
                }) && (e[0].search(/\$/) === -1)
            ) {
                stack.pop();
                res = e[0] + ' !';
                res += stackStatus(res);
                return res;
            }
        }

        // more then one destination
        // for (i = 0; i < e.length; i++) {
        //     for (j = 0; j < scope.variableList.length; j++) {
        //         if (scope.variableList[j].name === e[i]) {
        //             if (e.length === 1) {
        //                 res = e[i] + ' !';
        //                 stack.pop();
        //             } else {
        //                 res = 'dup ' + e[i] + ' !';
        //                 e.splice(i, 1);
        //             }
        //             res += stackStatus(res);
        //             return res;
        //         }
        //     }
        // }

        if (stack.length === 1) {
            return res;
        }

        if (stack[stack.length - 2][1].length === 0) {
            tmp = stack.pop();
            stack.pop();
            stack.push(tmp);
            res = 'nip';
            return res;
        }
        return res;
    }

    function cleanStack (init) {
        var res, temp;
        res = init || '';
        do {
            temp = cleanStackElement();
            if (temp !== '') {
                if (res === '') {
                    res = temp;
                } else {
                    res += ' ' + temp;
                }
            }
        } while (temp !== '')
        return res;
    }

    function varType (node) {
        switch (node.type) {

        case trav.Syntax.BinaryExpression:
            return 0; // local

        case trav.Syntax.IdentifierExpression:
            if (scope.variableList.some(function (e) {
                return e.name === node.name;
            })) {
                return 0; // local
            }
            return 1; // global

        case trav.Syntax.LiteralNumericExpression:
            return 2; // literal
        }
        return 1; // global
    }

    function pick (target, self) {
        var depth;
        stack.some(function (e, i, arr) {
            if (e[0] === target.name) {
                e[1].some(function (ee, ii) {
                    if (ee === self.name) {
                        e[1].splice(ii, 1);
                        return true;
                    }
                });
                depth = arr.length - i - 1;
                return true;
            }
        });
        stack.push([target.name, []]);
        return depth + ' pick';
    }

    astNode = scope.astNode;
    stack = [];
    stream = '';

    trav.traverse(astNode, {
        enter: function (node) {
            var forth;

            switch(node.type) {

            case trav.Syntax.FunctionDeclaration:
                stack = [];

                dfg.init.forEach(function (e) {
                    stack.push([e, dfg.to[e] || []]);
                });

                forth = ': ' + node.name.name;
                stream += forth + stackStatus(forth);
                forth = cleanStack();
                if (forth !== '') {
                    stream += forth + stackStatus(forth);
                }
                break;

            case trav.Syntax.ExpressionStatement:
                // node.forth = cleanStack();
                break;

            }
        },
        leave: function (node) {
            // var // path,
            var forth;
        //         tail;
        //
        //     path = this.path() || [];
        //     tail = path[path.length - 1];
        //
            switch (node.type) {
        //
        //     case trav.Syntax.LiteralNumericExpression:
        //         node.forth = node.value + '';
        //         break;
        //
        //     case trav.Syntax.Identifier:
        //         node.forth = node.name;
        //         break;
        //
        //     case trav.Syntax.Script:
        //         node.forth = node.body.forth;
        //         break;
        //
        //     case trav.Syntax.BlockStatement:
        //         node.forth = node.block.forth;
        //         break;
        //
        //     case trav.Syntax.VariableDeclarationStatement:
        //         node.forth = node.declaration.forth;
        //         break;
        //
        //     case trav.Syntax.IdentifierExpression:
        //         if (tail === 'binding') {
        //             forth = node.identifier.forth + ' !';
        //             forth += stackStatus(stack, forth);
        //         } else {
        //             forth = node.identifier.forth + ' @';
        //         }
        //         node.forth = forth; //  + stackStatus(stack, forth);
        //         break;
        //
            case trav.Syntax.BinaryExpression:
                // TODO
                // locate variable
                // global: put it on stack from global scope
                // local: PICK it from stack location

                forth = '';

                [node.left, node.right].forEach(function (e) {
                    switch (varType(e)) {

                    case 0:
                        forth += pick(e, node) + ' ';
                        break;

                    case 1:
                        forth += e.name + ' @ ';
                        stack.push([]);
                        break;

                    case 2:
                        forth += e.value + ' ';
                        stack.push([]);
                        break;
                    }
                });
                stack.pop();
                stack.pop();
                stack.push([node.name, dfg.to[node.name] || []]);
                // console.log(JSON.stringify(dfg.to[node.name]));

                // left     right
                // local0   local0 -- same local
                // local0   local1
                // local    global
                // local    literal

                // global   local
                // global0  global0 -- same global
                // global0  global1
                // global   literal

                // literal  local
                // literal  global
                // literal0 literal0 -- same literal
                // literal0 literal1

                forth += forthOperators(node.operator);

                forth = cleanStack(forth);
                forth = peephole(forth);
                stream += forth + stackStatus(forth);
                break;

            case trav.Syntax.AssignmentExpression:
                // node.forth
                //     = node.expression.forth
                //     + node.binding.forth;
                stack.pop();
                stack.push([node.binding.name, [dfg.to[node.binding.name]]]);
                // stream += node.expression.name + ' --> ' + ;
                stream += stackStatus('');
                break;
        //
        //     case trav.Syntax.ExpressionStatement:
        //         node.forth += node.expression.forth;
        //         break;
        //
        //     case trav.Syntax.IfStatement:
        //         if (node.alternate && node.alternate.forth) {
        //             node.forth
        //                 = node.test.forth
        //                 + 'if' + stackStatus(stack, 'if')
        //                 + node.consequent.forth
        //                 + 'else' + stackStatus(stack, 'else')
        //                 + node.alternate.forth
        //                 + 'then' + stackStatus(stack, 'then');
        //         } else {
        //             node.forth
        //                 = node.test.forth
        //                 + 'if' + stackStatus(stack, 'if')
        //                 + node.consequent.forth
        //                 + 'then' + stackStatus(stack, 'then');
        //         }
        //         break;
        //
        //     case trav.Syntax.ForStatement: // init test update body
        //         node.forth
        //             = node.init.forth
        //             + 'begin\n'
        //             + indent(node.test.forth)
        //             + 'while\n'
        //             + indent(node.body.forth + ' ' + node.update.forth)
        //             + 'repeat\n';
        //         break;
        //
            case trav.Syntax.FunctionDeclaration:
        //         forth = ': ' + node.name.forth;
        //
        //         node.forth
        //             = forth
        //             + stackStatus(stack, forth)
        //             + node.body.forth
                forth = ';';
                stream += forth + stackStatus(forth);
                break;
        //
        //     case trav.Syntax.ReturnStatement:
        //         node.forth = node.expression.forth
        //             + 'exit' + stackStatus(stack, 'exit');
        //         break;
        //
        //     case trav.Syntax.VariableDeclarator:
        //         node.forth = '';
        //         // if (node.init) {
        //         //     node.forth
        //         //         = '\ncreate ' + node.binding.forth + ' '
        //         //         + node.init.forth + ' ,';
        //         // } else {
        //         //     node.forth
        //         //         = '\nvariable ' + node.binding.forth;
        //         // }
        //         break;
        //
        //     case trav.Syntax.FunctionBody:
        //     case trav.Syntax.Block:
        //         node.forth = '';
        //         node.statements.forEach(function (e) {
        //             // if (node.forth !== '') {
        //             //     node.forth += '';
        //             // }
        //             node.forth += e.forth;
        //         });
        //         break;
        //
        //     case trav.Syntax.VariableDeclaration:
        //         node.forth = '';
        //         node.declarators.forEach(function (e) {
        //             if (node.forth !== '') {
        //                 node.forth += '\n';
        //             }
        //             node.forth += e.forth;
        //         });
        //         break;
        //
            }
        }
    });

    return stream;
}

module.exports = function (scope, options) {
    // console.log(JSON.stringify(heu, null, 2));

    var res;

    res = '';

    scope.variableList.forEach(function (e) {
        if (e.declarations.length === 0) {
            res += 'variable ' + e.name + '\n';
        }
    });

    scope.children.forEach(function (e) {
        res += '\n';
        // res += '\\ from: ' + JSON.stringify(e.dfg.from) + '\n';
        // res += '\\   to: ' + JSON.stringify(e.dfg.to) + '\n';
        res += insertForth(e, e.dfg, options);
        // res += e.astNode.forth;
    });

    scope.forth = res;
    return;

};
