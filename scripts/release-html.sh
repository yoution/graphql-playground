#!/bin/bash

if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed.' >&2
  exit 1
fi

set -e

cd packages

middlewares=(
  graphql-playground-middleware-express
  graphql-playground-middleware-hapi
  graphql-playground-middleware-koa
  graphql-playground-middleware-lambda
)

cd graphql-playground-html
echo "Releasing @apollographql/graphql-playground-html..."
yarn version --no-git-tag-version --new-version patch
yarn publish --non-interactive --access public
version=$(cat package.json | jq -r '.version')
cd ..

for middleware in "${middlewares[@]}"
do
  cd $middleware
  echo "Releasing ${middleware}..."
  yarn add @apollographql/graphql-playground-html@$version
  yarn version --no-git-tag-version --new-version patch
  yarn publish --non-interactive --access public
  cd ..
done

# Update dependents
# Note: React has html as a dev dependency
cd graphql-playground-electron
yarn add @apollographql/graphql-playground-html@$version
cd ..
cd graphql-playground-react
yarn add -D @apollographql/graphql-playground-html@$version

