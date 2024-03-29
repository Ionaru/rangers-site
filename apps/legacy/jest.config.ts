/* eslint-disable */
export default {
    coverageDirectory: '../../coverage/apps/legacy',
    displayName: 'legacy',
    globals: {},
    moduleFileExtensions: ['ts', 'js', 'html'],
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
};
