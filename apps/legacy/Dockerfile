FROM node:14-alpine

WORKDIR /app

COPY ./ormconfig.js ./

# Install dependencies
ENV NODE_ENV production
COPY ./dist/apps/legacy/package.json ./
RUN npm install --production

COPY ./dist/out-tsc/apps/legacy/migrations ./migrations

# Copy main file
COPY ./dist/apps/legacy/main.js ./

# Copy assets
COPY ./dist/apps/legacy/assets ./assets
COPY ./dist/apps/legacy/app ./app

CMD ["npm", "start"]
