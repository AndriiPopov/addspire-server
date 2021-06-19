module.exports = {
    env: {
        es6: true,
        node: true,
        es2021: true,
        mongo: true,
    },
    extends: [
        'eslint:recommended',
        'prettier',
        'plugin:import/errors',
        'plugin:import/warnings',
    ],
    plugins: ['prettier', 'import'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    rules: {
        'class-methods-use-this': 'off',
        'no-param-reassign': 'off',
        camelcase: 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
        'consistent-return': 'off',
        'import/no-unresolved': [2, { commonjs: true, amd: true }],
        'import/named': 2,
        'import/namespace': 2,
        'import/default': 2,
        'import/export': 2,
    },
}
