'use strict';

var expect = require('chai').expect,
    parse = require('shift-parser').default,
    analyze = require('shift-scope').default,
    forth = require('../lib').default;

describe('test1', function () {
    it('sub1', function () {
        var source, tree, scope;

        source = 'function foo () { a = b + c }';
        tree = parse(source);
        scope = analyze(tree);
        forth(scope);
        expect(scope.forth).to.be.equal(' variable b variable c variable a : foo ( -- ) b @ c @ + a ! ;');
    });
});

/*eslint-env mocha*/
