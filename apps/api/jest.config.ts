export default {
    coverageDirectory: '../../coverage/apps/api',
    displayName: 'api',
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        },
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': 'ts-jest',
    },
};
