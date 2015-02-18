'use strict';

var trav = require('shift-traverse');

module.exports = function (tree) {
    var counter;

    counter = 0;
    trav.traverse(tree, {
        enter: function (node) {
            if (node.type === trav.Syntax.FunctionBody) {
                counter = 0;
                return;
            }

            if (node.name === undefined) {
                switch (node.type) {

                case trav.Syntax.BinaryExpression:
                case trav.Syntax.ReturnStatement:
                    node.name = '$' + counter++;
                    break;
                case trav.Syntax.IdentifierExpression:
                    node.name = node.identifier.name;
                    break;
                }
            }
        }
    });
};
