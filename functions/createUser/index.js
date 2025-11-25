const KcAdminClient = require("@keycloak/keycloak-admin-client").default;
const { GraphQLClient, gql } = require('graphql-request');
const { queueEmail } = require('../callNodeFunction/lib/queueEmail.js');

/**
 * Creates a new user in both Keycloak and Hasura
 * Schedules welcome email to be sent overnight
 * 
 * @param {Object} req - Request object from Hasura action
 * @param {Object} res - Response object
 */
exports.createUser = async (req, res) => {
  // Verify the request contains the correct secret header
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET !== req.headers.secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { firstName, lastName, email } = req.body.input;

  // Validate input
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: firstName, lastName, email',
      messageKey: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format',
      messageKey: 'INVALID_EMAIL_FORMAT'
    });
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
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
        messageKey: 'USER_ALREADY_EXISTS'
      });
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
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists in database',
        messageKey: 'USER_ALREADY_EXISTS_IN_DB'
      });
    }

    // Create user in Keycloak (without password initially)
    keycloakUserId = await kcAdminClient.users.create({
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      emailVerified: false,
      // Don't set password - user will set it via password reset link
    });

    console.log(`Created Keycloak user: ${keycloakUserId}`);

    // Construct password reset link
    // User will need to request password reset from Keycloak's password reset page
    // We provide the link to that page in our welcome email
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

    // Assign default 'user' role in Keycloak
    const hasura_client = await kcAdminClient.clients.find({
      clientId: 'hasura',
      first: 1,
    });

    if (hasura_client && hasura_client.length > 0) {
      const userRole = await kcAdminClient.clients.findRole({
        clientUniqueId: hasura_client[0].id,
        roleName: 'user'
      });

      if (userRole) {
        await kcAdminClient.users.addClientRoleMappings({
          id: keycloakUserId,
          clientUniqueId: hasura_client[0].id,
          roles: [userRole]
        });
      }
    }

    // Schedule welcome email to be sent overnight (next day at 2 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM next day
    const scheduledAt = tomorrow;

    // Create variable replacer for email template
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const portalUrl = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';
    
    // Create a custom replacer that handles both standard variables and our custom ones
    const replaceVariables = (text) => {
      if (!text) return text;
      
      let result = text
        .replaceAll('[User:Firstname]', firstName)
        .replaceAll('[User:LastName]', lastName)
        .replaceAll('{{passwordResetLink}}', passwordResetLink)
        .replaceAll('{{portalUrl}}', portalUrl);
      
      return result;
    };

    // Queue the welcome email
    const emailResult = await queueEmail({
      templateType: 'USER_CREATED',
      variableReplacer: replaceVariables,
      recipientEmail: email,
      courseId: null, // Default template
      scheduledAt: scheduledAt,
      client: graphqlClient,
      logger: console // Simple logger for now
    });

    if (!emailResult.success) {
      console.error(`Failed to queue welcome email: ${emailResult.error}`);
      // Don't fail the user creation if email queuing fails
    }

    return res.json({
      success: true,
      userId: hasuraUserId,
      keycloakUserId: keycloakUserId,
      emailQueued: emailResult.success,
      scheduledAt: scheduledAt.toISOString(),
      messageKey: 'USER_CREATED_SUCCESS'
    });

  } catch (error) {
    console.error(`Error creating user: ${error.message}`, error);

    // Rollback: Delete user from Keycloak if created
    if (keycloakUserId) {
      try {
        await kcAdminClient.users.del({ id: keycloakUserId });
        console.log(`Rolled back Keycloak user: ${keycloakUserId}`);
      } catch (rollbackError) {
        console.error(`Error rolling back Keycloak user: ${rollbackError.message}`);
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
        console.log(`Rolled back Hasura user: ${hasuraUserId}`);
      } catch (rollbackError) {
        console.error(`Error rolling back Hasura user: ${rollbackError.message}`);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      messageKey: 'USER_CREATION_FAILED'
    });
  }
};

