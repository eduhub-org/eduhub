// Jest setup file for global test configuration

// Mock environment variables
process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
process.env.FRONTEND_URL = 'https://test.edu.opencampus.sh'; 