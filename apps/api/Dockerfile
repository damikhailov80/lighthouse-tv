# Built from the repository root (see `npm run api:docker`), because the API
# depends on packages/shared and npm workspaces resolve it through the root
# lockfile.
FROM node:22-alpine AS build

WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# The web workspace is not installed: it is not part of this image, and pulling
# Vite and React in would double the build for nothing.
RUN npm ci --workspace @lighthouse/api --workspace @lighthouse/shared --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm -w @lighthouse/shared run build \
 && npm -w @lighthouse/api exec -- prisma generate \
 && npm -w @lighthouse/api run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/package.json package.json
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/packages/shared/package.json packages/shared/package.json
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/package.json apps/api/package.json
# Carried into the image so the container can run `prisma migrate deploy` on the
# way up rather than needing a separate release step.
COPY --from=build /repo/apps/api/prisma apps/api/prisma

USER node
EXPOSE 3000
WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
