import KcAdminClient from "@keycloak/keycloak-admin-client";
import { GraphQLClient, gql } from 'graphql-request';
import { queueEmail } from '../lib/queueEmail.js';
import { createVariableReplacer } from '../emailTemplateVariables.js';
import { logger } from '../index.js';

/**
 * Creates a new user in both Keycloak and Hasura
 * Optionally sends welcome email immediately if sendEmail is true
 * 
 * @param {Object} req - Request object from Hasura action
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Response object
 */
export default async function createUser(req, logger) {
  logger.info("########## Create User ##########");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  const { firstName, lastName, email, sendEmail } = req.body.input;

  // Validate input
  if (!firstName || !lastName || !email) {
    return {
      success: false,
      error: 'Missing required fields: firstName, lastName, email',
      messageKey: 'MISSING_REQUIRED_FIELDS'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format',
      messageKey: 'INVALID_EMAIL_FORMAT'
    };
  }

  const kcAdminClient = new KcAdminClient({
    baseUrl: process.env.KEYCLOAK_URL,
    realmName: "master",
  });

  const graphqlClient = new GraphQLClient(process.env.HASURA_ENDPOINT, {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
    },
  });

  let keycloakUserId = null;
  let hasuraUserId = null;

  try {
    // Authenticate with Keycloak
    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_USER || "keycloak",
      password: process.env.KEYCLOAK_PW,
      grantType: "password",
      clientId: "admin-cli",
    });
    kcAdminClient.setConfig({
      realmName: "edu-hub",
    });

    // Check if user already exists in Keycloak by email
    const existingUsers = await kcAdminClient.users.find({
      email: email,
      exact: true
    });

    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: 'User with this email already exists',
        messageKey: 'USER_ALREADY_EXISTS'
      };
    }

    // Check if user already exists in Hasura
    const CHECK_USER = gql`
      query CheckUser($email: String!) {
        User(where: { email: { _eq: $email } }) {
          id
        }
      }
    `;

    const existingHasuraUser = await graphqlClient.request(CHECK_USER, { email });
    if (existingHasuraUser?.User?.length > 0) {
      return {
        success: false,
        error: 'User with this email already exists in database',
        messageKey: 'USER_ALREADY_EXISTS_IN_DB'
      };
    }

    // Create user in Keycloak (without password initially)
    const keycloakUser = await kcAdminClient.users.create({
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      emailVerified: false,
      // Don't set password - user will set it via password reset link
    });

    keycloakUserId = keycloakUser.id;
    logger.info(`Created Keycloak user: ${keycloakUserId}`);

    // Construct password reset link
    const keycloakBaseUrl = process.env.KEYCLOAK_URL.replace('/auth', '');
    const passwordResetLink = `${keycloakBaseUrl}/realms/edu-hub/login-actions/reset-credentials?client_id=hasura`;

    // Create user in Hasura database
    const INSERT_USER = gql`
      mutation InsertUser($id: uuid!, $firstName: String!, $lastName: String!, $email: String!) {
        insert_User_one(object: {
          id: $id
          firstName: $firstName
          lastName: $lastName
          email: $email
        }) {
          id
          firstName
          lastName
          email
        }
      }
    `;

    const hasuraUserResult = await graphqlClient.request(INSERT_USER, {
      id: keycloakUserId,
      firstName: firstName,
      lastName: lastName,
      email: email
    });

    hasuraUserId = hasuraUserResult.insert_User_one.id;
    logger.info(`Created Hasura user: ${hasuraUserId}`);

    // Assign default 'user' role in Keycloak
    // If role assignment fails, throw error to trigger rollback
    try {
      const hasura_client = await kcAdminClient.clients.find({
        clientId: 'hasura',
        first: 1,
      });

      if (!hasura_client || hasura_client.length === 0) {
        throw new Error('Hasura client not found in Keycloak');
      }

      const userRole = await kcAdminClient.clients.findRole({
        clientUniqueId: hasura_client[0].id,
        roleName: 'user'
      });

      if (!userRole) {
        throw new Error('User role not found in Keycloak');
      }

      await kcAdminClient.users.addClientRoleMappings({
        id: keycloakUserId,
        clientUniqueId: hasura_client[0].id,
        roles: [userRole]
      });
      logger.info(`Assigned 'user' role to Keycloak user: ${keycloakUserId}`);
    } catch (roleError) {
      logger.error(`Failed to assign 'user' role: ${roleError.message}`);
      throw new Error(`Failed to assign user role: ${roleError.message}`);
    }

    const portalUrl = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';

    let emailQueued = false;
    
    // Queue the welcome email only if sendEmail is true
    if (sendEmail) {
      // Create variable replacer function
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('de-DE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      const variableReplacer = createVariableReplacer({
        user: { firstName, lastName },
        passwordResetLink,
        portalUrl
      }, formatDate);

      // Also handle custom template variables for password reset link and portal URL
      const customReplacer = (text) => {
        if (!text) return text;
        let result = variableReplacer(text);
        result = result.replaceAll('{{passwordResetLink}}', passwordResetLink);
        result = result.replaceAll('{{portalUrl}}', portalUrl);
        return result;
      };

      const emailResult = await queueEmail({
        templateType: 'USER_CREATED',
        variableReplacer: customReplacer,
        recipientEmail: email,
        courseId: null,
        client: graphqlClient,
        logger: logger
      });

      if (!emailResult.success) {
        logger.error(`Failed to queue welcome email: ${emailResult.error}`);
        // Don't fail the user creation if email queuing fails
      } else {
        emailQueued = true;
        logger.info(`Queued welcome email for user ${email}`);
      }
    }

    return {
      success: true,
      userId: hasuraUserId,
      keycloakUserId: keycloakUserId,
      emailQueued: emailQueued,
      messageKey: 'CREATE_USER_SUCCESS'
    };

  } catch (error) {
    // Log full error details server-side
    logger.error(`Error creating user: ${error.message}`, { error: error.stack });

    // Rollback: Delete user from Keycloak if created
    if (keycloakUserId) {
      try {
        await kcAdminClient.users.del({ id: keycloakUserId });
        logger.info(`Rolled back Keycloak user: ${keycloakUserId}`);
      } catch (rollbackError) {
        logger.error(`Error rolling back Keycloak user: ${rollbackError.message}`);
      }
    }

    // Rollback: Delete user from Hasura if created
    if (hasuraUserId) {
      try {
        const DELETE_USER = gql`
          mutation DeleteUser($id: uuid!) {
            delete_User_by_pk(id: $id) {
              id
            }
          }
        `;
        await graphqlClient.request(DELETE_USER, { id: hasuraUserId });
        logger.info(`Rolled back Hasura user: ${hasuraUserId}`);
      } catch (rollbackError) {
        logger.error(`Error rolling back Hasura user: ${rollbackError.message}`);
      }
    }

    // Return generic error to client, don't leak internal details
    return {
      success: false,
      error: null,
      messageKey: 'USER_CREATION_FAILED'
    };
  }
}


