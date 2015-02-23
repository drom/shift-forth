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

        f = str.match('(.*)0 pick nip(.*)');
        if (f) { return f[1] + f[2]; }

        f = str.match('(.*)1 pick ' + op2 + ' nip(.*)');
        if (f) { return f[1] + 'swap ' + f[2] + f[3]; }

        f = str.match('(.*)0 pick 1 pick(.*)');
        if (f) { return f[1] + '0 pick 0 pick' + f[2]; }

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

    // stack is an array of elements: [e0, e1, ...]
    // element is an array with name and array of dependents: [name, [d0, ...]]

    function stackStatus (init) {
        var arr, ret;

        // console.log(JSON.stringify(stack));

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

    function pick (target, self) {

        // target is the node we need to pick from the stack
        // self is the current node

        // example:
        // stack before: [[], ..., ["a",["b", "c", "d"]], ..., []]
        // pick({name:"a"}, {name:"c"})
        // stack after:  [[], ..., ["a",["b",      "d"]], ..., [], ["c", []]]


        var depth; // pick depth

        // remove one dependent from the stack element
        // and returns true if it matches

        // stack element before: ["a", ["b", "c", "d"]]
        // cut("c", 1) -> true
        // stack element before: ["a", ["b",      "d"]]
        function cut (name, index, arr) {
            if (name === self.name) {
                arr.splice(index, 1);
                return true;
            }
        }

        stack.some(function (element, index) {
            if (element[0] === target.name) { // name field
                if (element[1].some(cut)) { // array of dependents
                    depth = stack.length - index - 1;
                    return true;
                }
            }
        });

        stack.push([self.name, dfg.to[self.name] || []]);
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

                forth = '\n: ' + node.name.name;
                stream += forth + stackStatus(forth);
                forth = cleanStack();
                if (forth !== '') {
                    stream += forth + stackStatus(forth);
                }
                break;

            }
        },
        leave: function (node, parent) {
            var path,
                forth,
                tail;

            path = this.path() || [];
            tail = path[path.length - 1];

            switch (node.type) {

            case trav.Syntax.LiteralNumericExpression:
                stack.push([node.name, [parent.name]]);
                forth = node.value + '';
                // forth = cleanStack(forth);
                stream += forth + stackStatus(forth);
                break;
            case trav.Syntax.IdentifierExpression:
                if (tail !== 'binding') { // not assigned value
                    if (
                        scope.variableList.some(function (e) {
                            return e.name === node.identifier.name;
                        }) || node.identifier.name.match(/\$/)
                    ) {
                        // console.log([node.identifier.name, node.name]);
                        forth = pick(node.identifier, node); // local
                    } else {
                        forth = node.identifier.name + ' @'; // global
                        stack.push([node.name, [parent.name]]);
                    }
                    // forth = cleanStack(forth);
                    stream += forth + stackStatus(forth);
                }
                break;
            case trav.Syntax.BinaryExpression:
                stack.pop();
                stack.pop();
                stack.push([node.name, dfg.to[node.name] || []]);

                forth = forthOperators(node.operator);
                forth = cleanStack(forth);
                // forth = peephole(forth);
                stream += forth + stackStatus(forth);
                break;
            case trav.Syntax.AssignmentExpression:
                // node.forth
                //     = node.expression.forth
                //     + node.binding.forth;

                if (scope.variableList.some(function (e) {
                    return e.name === node.binding.identifier.name;
                })) { // local
                    forth = '';
                    stack.pop();
                    stack.push([node.binding.identifier.name, dfg.to[node.binding.identifier.name]]);
                } else { // global
                    forth = node.binding.name + ' !';
                    stack.pop();
                }
                // forth = peephole(forth);
                forth = cleanStack(forth);
                stream += forth + stackStatus(forth);
                break;
            case trav.Syntax.IfStatement:
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
                break;
            case trav.Syntax.FunctionDeclaration:
                forth = ';';
                stream += forth + stackStatus(forth);
                break;
            case trav.Syntax.ReturnStatement:
                forth = cleanStack();
                forth += (forth === '' ? '' : ' ');
                forth += 'exit';
                stream += forth + stackStatus(forth);
                break;
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

            if (parent && (parent.type === trav.Syntax.IfStatement)) {
                switch (tail) {
                case 'test':
                    stack.pop();
                    forth = 'if';
                    stream += forth + stackStatus(forth);
                    break;
                case 'consequent':
                    forth = 'else';
                    stream += forth + stackStatus(forth);
                    break;
                case 'alternate':
                    forth = 'then';
                    stream += forth + stackStatus(forth);
                    break;
                }
            }

        }
    });

    return peephole(stream);
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
        // console.log(JSON.stringify(e.dfg, null, 4));
        res += insertForth(e, e.dfg, options);
    });

    scope.forth = res;
    return;

};
