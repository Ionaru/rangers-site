export default {
    coverageDirectory: '../../coverage/libs/entities',
    displayName: 'entities',
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        },
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    preset: '../../jest.preset.js',
    transform: {
        '^.+\\.[tj]sx?$': 'ts-jest',
    },
};
