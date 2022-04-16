# 7R Website, activity tracker and Discord bot

This repo contains the code for a website and user-management system in use by the 7R community.
Additionally, a discord bot tracks LOAs and TS3 integration tracks activity.

## Development

The project uses the Nx-style monorepo pattern, more on https://nx.dev/.

The project in its current form has several parts:
- The website is a server-side rendered (SSR) application that uses the [Express](https://expressjs.com/) framework. But abstracted through https://github.com/Ionaru/micro-web-service. Templating is done with [Handlebars](https://handlebarsjs.com/).
- The Discord bot uses the [Discord.js](https://discord.js.org/) framework and [/create](https://slash-create.js.org/), it listens to `/loa` and `/loa-cancel` commands in a specific Discord channel.
- Syncronization between Enjin and this website is done through a few tasks in [apps/legacy/src](apps/legacy/src/app/tasks) and mostly uses a regular requests library ([Axios](https://axios-http.com/)) as seen in [apps/legacy/src/app/services/enjin.service.ts](apps/legacy/src/app/services/enjin.service.ts).
- Interaction with Teamspeak is handled through the [ts3-nodejs-library](https://multivit4min.github.io/TS3-NodeJS-Library/), it records who is in the Operation TS3 channel during operation times, and adds/removes roles where needed.
- The database is accessed through [TypoORM](https://typeorm.io/) and has a [MySQL](https://www.mysql.com/) backend.

Create a `.env` file in the root of the repository and add all the options from the [Environment variables](#environment-variables) section.

### Useful project links
- [Legacy app folder](apps/legacy/src)
- [Legacy app database migrations](apps/legacy/migrations)
- [Legacy app dockerfile](apps/legacy/Dockerfile)
- [Entities folder](libs/entities/src/lib)

### Commands

- `npm run start`: Starts the development server.
- `npm run lint`: Lints the code for errors and style violations.
- `npm run nx build-image legacy -- --tag latest`: Build a Docker image of the Legacy app.
- `npm run migrate -- -- -c legacy`: Run database migrations for the legacy app/connection.
- `npm run typeorm -- migration:generate -c legacy -n "Migration purpose"`: Generate a migration for the legacy app/connection.

## Deployment

This program should be deployed using Docker or Docker-Compose.

### Configuration

#### Discord app

The program needs access to a Discord Developer Application to function.
More information here: https://discord.com/developers/applications.

#### Teamspeak credentials

The programs needs access to a Teamspeak server to function.
A ServerQuery username and password need to be created on a TS3 server and entered in the variables below.

#### Database SSL certificates

Three certificates are required in the `data/` folder to securely connect to a database.

- `ca.pem`
- `client-cert.pem`
- `client-key.pem`

More information on https://dev.mysql.com/doc/refman/5.7/en/encrypted-connections.html.

#### Environment variables

Environment variables are used to store most configuration data.

- `DEBUG` (optional): Parameters for the debug package. See <https://www.npmjs.com/package/debug> for more information.
- `RANGERS_ADMINS` (optional): A comma-separated list of Discord IDs of users who are "admin" on the website.
- `RANGERS_COOKIE_NAME`: The name of the cookie used to store the user's session.
- `RANGERS_COOKIE_SECRET`: The secret used to sign the cookie.
- `RANGERS_DB_HOST`: The hostname of the database.
- `RANGERS_DB_NAME`: The name of the database.
- `RANGERS_DB_PASS`: The password of the database account.
- `RANGERS_DB_PORT`: The port of the database.
- `RANGERS_DB_USER`: The username of the database account.
- `RANGERS_DISCORD_CLIENT_ID`: The client ID of the Discord app.
- `RANGERS_DISCORD_CLIENT_SECRET`: The client secret of the Discord app.
- `RANGERS_DISCORD_RETURN_URL`: The URL to return to after logging in with Discord, must match one configured in the Discord application.
- `RANGERS_DISCORD_TOKEN`: The token of the Discord app.
- `RANGERS_ENJIN_DOMAIN`: The domain of the Enjin website.
- `RANGERS_ENJIN_KEY`: The API key of the Enjin website.
- `RANGERS_PORT`: The port the website should listen on.
- `RANGERS_TS_HOST`: The hostname of the Teamspeak server.
- `RANGERS_TS_NICKNAME`: The nickname of the bot on the Teamspeak server.
- `RANGERS_TS_PASSWORD`: The password of the bot on the Teamspeak server.
- `RANGERS_TS_PORT`: The port of the Teamspeak server.
- `RANGERS_TS_QUERY_PORT`: The query port of the Teamspeak server.
- `RANGERS_TS_USERNAME`: The username of the bot on the Teamspeak server, can differ from the nickname.
- `RANGERS_TS_OPERATIONS_CHANNEL`: The TS3 channel ID of the Operations channel, used to register player activity.
- `RANGERS_TASK_SYNC_RANKS` (optional, default false): Whether to sync the ranks of users with Enjin.
- `RANGERS_TASK_SYNC_ROLES` (optional, default false): Whether to sync the roles of users with Enjin.
- `RANGERS_TASK_SYNC_BADGES` (optional, default false): Whether to sync the badges of users with Enjin.
- `RANGERS_TASK_SYNC_ENJIN_TAGS` (optional, default false): Whether to sync available ranks, roles and badges with Enjin.
