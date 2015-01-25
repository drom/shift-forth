'use strict';

var expect = require('chai').expect,
    parse = require('shift-parser').default,
    lib = require('../lib');

describe('test1', function () {
    it('subtest1', function () {
        var src, tree;

        src = 'var a = 42;';
        tree = {};
        tree = {};
        tree = parse(src);
        lib.emit(tree);
        // console.log(JSON.stringify(tree, null, 2));
        expect(tree.forth).to.be.equal('create a 42 ,');
    });
});

/*eslint-env mocha*/
