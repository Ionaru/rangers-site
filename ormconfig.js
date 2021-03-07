/**
 * @file Manages the configuration settings for TypeORM.
 */
const {readFileSync} = require('fs');
const {join} = require('path');

const buildMySQLConnectionOptions = (
    {
        moduleName,
        database,
        host,
        port,
        username,
        password,
        sslCA,
        sslCert,
        sslKey,
        sslReject = true,
        timezone = 'Z',
        models = []
    }
) => {

    const runningMigration = process.argv.length >= 3 && process.argv[2].includes('migration');

    const connectionOptions = {
        database,
        host,
        password,
        port,
        timezone,
        type: 'mysql',
        username,
        name: moduleName,
    };

    if (sslCA && sslCert && sslKey) {
        connectionOptions.ssl = {
            ca: readFileSync(sslCA).toString(),
            cert: readFileSync(sslCert).toString(),
            key: readFileSync(sslKey).toString(),
            rejectUnauthorized: sslReject,
        };

        if (!sslReject) {
            process.emitWarning('SSL connection to Database is not secure, \'sslReject\' should be true');
        }
    }

    if (!connectionOptions.ssl && !['localhost', '0.0.0.0', '127.0.0.1'].includes(host)) {
        process.emitWarning('Connection to Database is not secure, always use SSL to connect to external databases!');
    }

    const mapper = (model) => join(__dirname, 'dist', 'out-tsc', 'libs', 'entities', 'src', 'lib', `${model}.js`);
    connectionOptions.entities = runningMigration ? models.map(mapper) : [];

    if (runningMigration) {
        const migrationsDir = `apps/${moduleName}/migrations`;
        connectionOptions.cli = {
            migrationsDir,
        };
        connectionOptions.migrations = [`${migrationsDir}/*.{js,ts}`];
        connectionOptions.migrationsTableName = 'migrations';
    }

    return connectionOptions;
};

module.exports = [
    buildMySQLConnectionOptions({
        moduleName: 'legacy',
        database: process.env.RANGERS_DB_NAME,
        host: process.env.RANGERS_DB_HOST,
        port: Number(process.env.RANGERS_DB_PORT),
        username: process.env.RANGERS_DB_USER,
        password: process.env.RANGERS_DB_PASS,
        sslCA: 'data/ca.pem',
        sslCert: 'data/clientcert.pem',
        sslKey: 'data/clientkey.pem',
        sslReject: false,
        models: [
            'attendance.model',
            'teamspeak-user.model',
            'teamspeak-rank.model',
            'application.model',
            'operation.model',
            'badge.model',
            'incident.model',
            'loa.model',
            'rank.model',
            'role.model',
            'session.model',
            'user.model',
            'permission.model',
            'enjin-tag.model',
        ],
    }),
];
