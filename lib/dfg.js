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

var _ = require('lodash'),
    trav = require('shift-traverse');

function dfg (scope) {
    if (scope.type && scope.type.name === 'function') {

        scope.dfg = {init: [], from: {}, to: {}};

        scope.astNode.parameters.some(function (e) {
            scope.dfg.init.push(e.name);
        });

        trav.traverse(scope.astNode, {
            leave: function (node) {
                var depend;

                switch(node.type) {

                case trav.Syntax.IdentifierExpression:
                    node.depend = [node.identifier.name];
                    break;

                case trav.Syntax.LiteralNumericExpression:
                    node.depend = [];
                    break;

                case trav.Syntax.BinaryExpression:
                    node.depend = [node.name];
                    depend = _.union(node.left.depend, node.right.depend);
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
