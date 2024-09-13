import { generate, loadContext } from '@graphql-codegen/cli';
import { ExecutorContext } from '@nx/devkit';

interface GraphQLCodegenExecutorOptions {
  configFile: string;
}

export default async function graphqlCodegenExecutor(
  options: GraphQLCodegenExecutorOptions,
  context: ExecutorContext
) {
  console.log('Executing GraphQL Codegen...');

  try {
    const config = await loadContext(options.configFile);
    await generate(config);

    console.log('GraphQL Codegen completed successfully');
    return { success: true };
  } catch (error) {
    console.error('GraphQL Codegen failed:', error);
    return { success: false };
  }
}
