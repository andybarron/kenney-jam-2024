FROM node:22

RUN corepack enable
USER node
WORKDIR /home/node
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production=false
COPY --chown=node:node . ./
RUN pnpm build
CMD ["pnpm", "start"]
