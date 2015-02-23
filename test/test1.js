'use strict';

var expect = require('chai').expect,
    parse = require('shift-parser').default,
    analyze = require('shift-scope').default,
    lib = require('../lib');

var data = {
    add42: {
        src: 'function add42 (a) { return a + 42; }',
        res: ': add42 42 + exit ; '
    },
    sub: {
        src: 'function sub (a, b) { return a - b; }',
        res: ': sub - exit ; '
    },
    mul_global: {
        src: 'function mul_global (a) { return a * g0; }',
        res: 'variable g0\n: mul_global g0 @ * exit ; '
    },
    add3_fast: {
        src: 'function add3_fast (a, b, c) { return b + c + a; }',
        res: ': add3_fast + + exit ; '
    },
    add3_slow: {
        src: 'function add3_slow (a, b, c) { return a + b + c; }',
        res: ': add3_slow 2 pick 2 pick + + nip nip exit ; '
    },
    add_var: {
        src: 'function add_var (a, b) { var x; x = a + b; return x; }',
        res: ': add_var +   exit ; '
    }
};

/*

function add42 (a) {
  return a + 42;
}

function sub (a, b) {
  return a - b;
}

function mul_global (a) {
  return a * g0;
}

function add3_fast (a, b, c) {
  return b + c + a;
}

function add3_slow (a, b, c) {
  return a + b + c;
}

function add_var (a, b) {
  var x;
  x = a + b;
  return x;
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
