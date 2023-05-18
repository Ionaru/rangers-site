const { getJestProjects } = require('@nx/jest');

export default {
    projects: [
        ...getJestProjects(),
        '<rootDir>/apps/api',
        '<rootDir>/apps/legacy',
        '<rootDir>/libs/entities',
        '<rootDir>/libs/interfaces',
    ],
};
