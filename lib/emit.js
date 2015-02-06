'use strict';

var trav = require('shift-traverse');

function forthOperators (operator) {
    var table = {
        '&&': 'and',
        '~': 'invert',
        '||': 'or',
        '<<': 'lshift',
        '>>': 'rshift',
        // Forth
        '==': '='
        // PAF
        // '==': '=?',
        // '<' : '<?',
        // '>' : '>?',
        // '<=': '<=?',
        // '>=': '>=?'
    };
    return table[operator] || operator;
}


function indent (str) {
    var oArray,
        iArray;

    oArray = [];
    iArray = str.split('\n');

    if (iArray.length === 1) {
        return '  ' + str;
    }

    iArray.forEach(function (e) {
        if (e === '') {
            oArray.push(e);
            return;
        }
        oArray.push('  ' + e);
    });
    return oArray.join('\n');
}

function insertForth (tree) {
    trav.traverse(tree, {
        leave: function (node) {
            var path,
                tail;

            path = this.path() || [];
            tail = path[path.length - 1];

            switch (node.type) {

            case trav.Syntax.LiteralNumericExpression:
                node.forth = node.value;
                break;

            case trav.Syntax.Identifier:
                node.forth = node.name;
                break;

            case trav.Syntax.Script:
                node.forth = node.body.forth;
                break;

            case trav.Syntax.BlockStatement:
                node.forth = node.block.forth;
                break;

            case trav.Syntax.VariableDeclarationStatement:
                node.forth = node.declaration.forth;
                break;

            case trav.Syntax.IdentifierExpression:
                if (tail === 'binding') {
                    node.forth = node.identifier.forth;
                } else {
                    node.forth = node.identifier.forth + ' @';
                }
                break;

            case trav.Syntax.BinaryExpression:
                node.forth
                    = node.left.forth + ' '
                    + node.right.forth + ' '
                    + forthOperators(node.operator);
                break;

            case trav.Syntax.AssignmentExpression:
                node.forth
                    = node.expression.forth + ' '
                    + node.binding.forth + ' !';
                break;

            case trav.Syntax.ExpressionStatement:
                node.forth = node.expression.forth;
                break;

            case trav.Syntax.IfStatement:
                if (node.alternate && node.alternate.forth) {
                    node.forth
                        = node.test.forth
                        + '\nif\n'
                        + indent(node.consequent.forth)
                        + '\nelse\n'
                        + indent(node.alternate.forth)
                        + '\nthen\n';
                } else {
                    node.forth
                        = node.test.forth
                        + '\nif\n'
                        + indent(node.consequent.forth)
                        + '\nthen\n';
                }
                break;

            case trav.Syntax.ForStatement: // init test update body
                node.forth
                    = node.init.forth
                    + '\nbegin\n'
                    + indent(node.test.forth)
                    + '\nwhile\n'
                    + indent(node.body.forth + ' ' + node.update.forth)
                    + '\nrepeat\n';
                break;

            case trav.Syntax.FunctionDeclaration:
                node.forth
                    = ' : ' + node.name.forth
                    + ' ( -- ) ' + node.body.forth
                    + ' ;';
                break;

            case trav.Syntax.ReturnStatement:
                node.forth = node.expression.forth + '\nexit\n';
                break;

            case trav.Syntax.VariableDeclarator:
                if (node.init) {
                    node.forth
                        = 'create ' + node.binding.forth + ' '
                        + node.init.forth + ' ,';
                } else {
                    node.forth
                        = 'variable ' + node.binding.forth;
                }
                break;

            case trav.Syntax.FunctionBody:
            case trav.Syntax.Block:
                node.forth = '';
                node.statements.forEach(function (e) {
                    if (node.forth !== '') {
                        node.forth += ' ';
                    }
                    node.forth += e.forth;
                });
                break;

            case trav.Syntax.VariableDeclaration:
                node.forth = '';
                node.declarators.forEach(function (e) {
                    if (node.forth !== '') {
                        node.forth += '\n';
                    }
                    node.forth += e.forth;
                });
                break;

            }
        }
    });
}

module.exports = function (scope) {
    // console.log(JSON.stringify(scope, null, 2));

    var res = '';

    scope.variableList.forEach(function (e) {
        if (e.declarations.length === 0) {
            res += ' variable ' + e.name;
        }
    });

    scope.children.forEach(function (e) {
        insertForth(e.astNode);
        res += e.astNode.forth;
    });

    scope.forth = res;
    return;
};
