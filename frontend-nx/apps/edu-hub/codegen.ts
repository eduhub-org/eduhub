// codegen.edu-hub.ts

import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [process.env.GRAPHQL_URI || 'http://hasura:8080/v1/graphql']: {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || 'myadminsecretkey',
        },
      },
    },
  ],
  generates: {
    'apps/edu-hub/types/generated/': {
      preset: 'client',
      documents: 'apps/edu-hub/graphql/**/*.{ts,tsx}',
      presetConfig: {
        fragmentMasking: true,
      },
    },
  },
};

export default config;
