## GraphQL Folder Structure and Naming Conventions

Our project uses GraphQL for efficient data fetching and manipulation. This section outlines the folder structure and naming conventions we use for organizing our GraphQL-related files within the NX workspace.

### Overview

The GraphQL folder structure is located in the `edu-hub` app of our NX workspace:

```
frontend-nx/apps/edu-hub/graphql/
```

### Folder Structure

```
graphql/
│
├── queries/
│   ├── user/
│   │   ├── getUser.ts
│   │   └── getUserPosts.ts
│   ├── post/
│   │   ├── getPost.ts
│   │   └── getRecentPosts.ts
│   └── comment/
│       └── getComments.ts
│
├── mutations/
│   ├── user/
│   │   ├── createUser.ts
│   │   └── updateUser.ts
│   ├── post/
│   │   ├── createPost.ts
│   │   └── updatePost.ts
│   └── comment/
│       └── addComment.ts
│
├── fragments/
│   ├── userFragments.ts
│   ├── postFragments.ts
│   └── commentFragments.ts
│
└── types.ts
```

### Structure Explanation

1. **queries/**: Contains all GraphQL query operations, organized by entity (user, post, comment).
2. **mutations/**: Houses all GraphQL mutation operations, also organized by entity.
3. **fragments/**: Stores reusable GraphQL fragments, grouped by entity.
4. **types.ts**: Auto-generated TypeScript types for our GraphQL schema and operations.

### Naming Conventions

We follow specific naming conventions to maintain consistency and clarity:

1. **Constants**: Use UPPER_SNAKE_CASE
   - Example: `ACHIEVEMENT_OPTIONS`

2. **Queries and Mutations**: Use PascalCase
   - Example: `AchievementOptions`

3. **File Names**: Use camelCase with `.ts` extension
   - Example: `achievementOptions.ts`

4. **Fragments**: Follow the same conventions as queries/mutations

### File Organization

- Each query, mutation, or fragment should be in a separate file.
- File names should reflect the operation they contain.

Example:
```
queries/
  achievement/
    achievementOptions.ts  // Contains AchievementOptions query
    getAchievement.ts      // Contains GetAchievement query
```

### Usage

When working with GraphQL in our project:

1. Place new queries in the appropriate entity folder under `queries/`.
2. Add new mutations to the relevant entity folder in `mutations/`.
3. Create and store reusable fragments in the `fragments/` directory.
4. Import generated types from `types.ts` for type-safe GraphQL operations.

Example import:

```typescript
import { GetUserQuery, GetUserQueryVariables } from '../graphql/types';
```

Example query file (achievementOptions.ts):

```typescript
import { gql } from '@apollo/client';

export const ACHIEVEMENT_OPTIONS = gql`
  query AchievementOptions {
    achievementOptions {
      id
      name
    }
  }
`;
```

### Code Generation

We use GraphQL Code Generator to auto-generate TypeScript types. The configuration is in `codegen.yml` at the workspace root. To generate types:

1. Ensure your GraphQL schema and operations are up to date.
2. In the folder `frontend-nx` run the generation script:

   ```
   yarn generate:graphql
   ```

3. The generated types will be updated in `graphql/types.ts`.

Remember to regenerate types after making changes to your GraphQL schema or operations.

### Best Practices

1. Keep queries and mutations focused on specific entities.
2. Use fragments to share common fields between queries and mutations.
3. Always use the generated types for type safety in your TypeScript code.
4. Regularly update the generated types to keep them in sync with your schema.
5. Stick to the naming conventions for consistency across the project.
6. Keep each operation (query, mutation, fragment) in its own file for better organization and easier maintenance.

By following this structure, naming conventions, and these guidelines, we maintain a clean, organized, and type-safe GraphQL implementation in our NX workspace.