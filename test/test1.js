'use strict';

var expect = require('chai').expect,
    parse = require('shift-parser').default,
    analyze = require('shift-scope').default,
    lib = require('../lib');

var data = {
    add42: {
        src: 'function add42 (a) { return a + 42; }',
        res: '\n: add42 42 + ; '
    },
    sub: {
        src: 'function sub (a, b) { return a - b; }',
        res: '\n: sub - ; '
    },
    mul_global: {
        src: 'function mul_global (a) { return a * g0; }',
        res: 'variable g0\n\n: mul_global g0 @ * ; '
    },
    add3_fast: {
        src: 'function add3_fast (a, b, c) { return b + c + a; }',
        res: '\n: add3_fast + + ; '
    },
    add3_slow: {
        src: 'function add3_slow (a, b, c) { return a + b + c; }',
        res: '\n: add3_slow 2 pick 2 pick + + nip nip ; '
    },
    add_var: {
        src: 'function add_var (a, b) { var x; x = a + b; return x; }',
        res: '\n: add_var +  ; '
    }
};

/*

function add (a, b) {
    return a + b;
}

function add (a, b) {
    var z;
    z = a + b;
    return z;
}

function add (a, b) {
    var z = a + b;
    return z;
}

function max (a, b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

function max (a, b) {
    if (a > b) {
        return a;
    }
    return b;
}

function max (a, b) {
    var z, z0, z1;
    if (a > b) {
        z0 = a;
    } else {
        z1 = b;
    }
    z = phi(z0, z1);
    return z;
}

*/

describe('emiter', function () {
    Object.keys(data).forEach(function (key) {
        it(key, function (done) {
            var source, tree, scope;
            source = data[key].src;
            tree = parse(source);
            lib.naming(tree);
            scope = analyze(tree);
            lib.dfg(scope);
            lib.emit(scope);
            expect(scope.forth).to.be.equal(data[key].res);
            done();
        });
    });
});

/*eslint-env mocha*/
