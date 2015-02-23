'use strict';

// adds 'dfg' section to every scoped basic block

// dfg: {
//     init: ['a'], // initial parameter stack state
//     edge: { // all data dependencies in this block
//         b: ['a'],
//         c: ['b', 'a']
//     },
//     done: ['c'] // final parameter stack state
// }

var // _ = require('lodash'),
    trav = require('shift-traverse');

function dfg (scope) {
    if (scope.type && scope.type.name === 'function') {

        scope.dfg = {init: [], from: {}, to: {}};

        scope.astNode.parameters.some(function (e) {
            scope.dfg.init.push(e.name);
        });

        trav.traverse(scope.astNode, {
            leave: function (node) {
                var depend,
                    path,
                    tail;

                path = this.path() || [];
                tail = path[path.length - 1];

                switch(node.type) {

                case trav.Syntax.LiteralNumericExpression:
                    node.depend = [node.name];
                    break;

                case trav.Syntax.IfStatement:
                    depend = node.test.depend;
                    scope.dfg.from[node.name] = depend;
                    scope.dfg.to[depend] = [node.name];
                    break;

                case trav.Syntax.Identifier:
                    node.depend = [node.name];
                    break;

                case trav.Syntax.IdentifierExpression:
                    if (tail !== 'binding') { // not assigned value
                        node.depend = [node.name];
                        depend = node.identifier.depend;
                        scope.dfg.from[node.name] = depend;
                        if (depend) {
                            depend.forEach(function (e) {
                                scope.dfg.to[e] = scope.dfg.to[e] || [];
                                scope.dfg.to[e].push(node.name);
                            });
                        }
                    }
                    break;

                case trav.Syntax.BinaryExpression:
                    node.depend = [node.name];
                    depend = node.left.depend.concat(node.right.depend);
                    scope.dfg.from[node.name] = depend;
                    if (depend) {
                        depend.forEach(function (e) {
                            scope.dfg.to[e] = scope.dfg.to[e] || [];
                            scope.dfg.to[e].push(node.name);
                        });
                    }
                    break;

                case trav.Syntax.AssignmentExpression:
                    depend = node.expression.depend;
                    scope.dfg.from[node.binding.identifier.name] = depend;
                    if (depend) {
                        depend.forEach(function (e) {
                            scope.dfg.to[e] = scope.dfg.to[e] || [];
                            scope.dfg.to[e].push(node.binding.identifier.name);
                        });
                    }
                    // scope.dfg.edge.a = [];
                    break;

                case trav.Syntax.ReturnStatement:
                    depend = node.expression.depend;
                    scope.dfg.from[node.name] = depend;
                    scope.dfg.to[depend] = [node.name];
                    break;
                }
            }
        });

        // console.log(scope.dfg);
    }
    scope.children.some(dfg);
}

module.exports = dfg;
