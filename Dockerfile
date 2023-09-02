FROM node:19.7.0-alpine

WORKDIR /usr/src/app

COPY .yarn ./.yarn
COPY .pnp.cjs .yarnrc.yml package.json yarn.lock package* tsconfig.json tsconfig.build.json ./

# yarn install --immutable --immutable-cache 에서 yarn set version 3.6.0 && yarn install 로 변경
RUN yarn set version 3.6.0 && yarn install

COPY . ./

RUN yarn build

EXPOSE 8000