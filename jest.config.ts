const { getJestProjects } = require('@nrwl/jest');

module.exports = {
    projects: [
        ...getJestProjects(),
        '<rootDir>/apps/api',
        '<rootDir>/apps/legacy',
        '<rootDir>/libs/entities',
        '<rootDir>/libs/interfaces',
    ],
};
