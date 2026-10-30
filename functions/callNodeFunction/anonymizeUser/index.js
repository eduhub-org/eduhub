import { request } from 'graphql-request';
import { Storage } from '@google-cloud/storage';
import { buildCloudStorage } from '../lib/cloud-storage.js';
import { getKeycloakToken } from '../lib/utils.js';
import { unsubscribeForAccountDeletion } from '../syncGhostNewsletterSubscription/index.js';
import { deactivateMatrixUser, getMatrixDeactivationConfig, toMatrixUserId } from '../lib/matrixInvite.js';
import axios from 'axios';
import path from 'node:path';
import { GET_DELETION_DATA, ERASE_PERSONAL_DATA, getErasureVariables } from './personalData.js';

// Stay below the 180 s action/function limit, so the caller gets the retryable
// partial result instead of a generic timeout.
const DEADLINE_MS = 150_000;
const MATRIX_TIMEOUT_MS = 60_000;
const KEYCLOAK_TIMEOUT_MS = 15_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const missingFile = (error) => error.code === 'ENOENT' || error.code === 404 || error.response?.status === 404;

async function deleteFile(storage, filename, bucket) {
  try {
    await storage.deleteFile(filename, bucket);
  } catch (error) {
    if (!missingFile(error)) throw error;
  }
}

async function removeProfileImage(storage, picture, bucket) {
  if (!picture) return;
  await deleteFile(storage, picture, bucket);
  const directory = path.dirname(picture);
  const basename = path.basename(picture, path.extname(picture));
  let files;
  try {
    files = await storage.listFiles(bucket, { prefix: directory });
  } catch (error) {
    if (missingFile(error)) return;
    throw error;
  }
  for (const file of files) {
    if (path.basename(file.name).startsWith(`${basename}-`) && file.name.endsWith('.webp')) {
      await deleteFile(storage, file.name, bucket);
    }
  }
}

// Needs the handle, so it must run before the database erase clears it.
async function removeMatrixAccount(matrixUserHandle, logger, userId, timeoutMs) {
  if (!matrixUserHandle) return;
  const config = getMatrixDeactivationConfig();
  if (!config) {
    // A partial configuration must not clear the handle while the account stays active.
    if (process.env.MATRIX_HOMESERVER_URL?.trim()) throw new Error('Matrix deactivation config incomplete');
    // No homeserver at all (e.g. local development): there is no Matrix integration to clean up.
    logger.warn?.('Matrix not configured; skipping Matrix account deactivation', { userId });
    return;
  }
  // Fail rather than skip: the confirmation dialog promises the Element account is deactivated.
  if (!config.token) throw new Error('MATRIX_SYNAPSE_ADMIN_TOKEN missing');
  await deactivateMatrixUser({
    homeserverUrl: config.homeserverUrl,
    token: config.token,
    matrixUserId: toMatrixUserId(matrixUserHandle, config.serverName),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function eraseAccount(req, logger, userId) {
  const result = {
    anonymizedUserId: userId,
    messageKey: 'ANONYMIZATION_FAILED',
    error: null,
    steps: {
      keycloak_deletion: false,
      matrix_deactivation: false,
      user_data_anonymization: false,
      profile_picture_removal: false,
      certificate_anonymization: false,
      motivation_letter_anonymization: false,
    },
  };
  const startedAt = Date.now();
  const timeLeft = () => DEADLINE_MS - (Date.now() - startedAt);
  const checkpoint = () => {
    if (timeLeft() <= 0) throw new Error('DEADLINE_EXCEEDED');
  };
  const query = (document, variables) => request(
    process.env.HASURA_ENDPOINT, document, variables,
    { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET }
  );

  try {
    if (!UUID.test(userId || '')) throw new Error('ERROR_INVALID_UUID');
    const data = await query(GET_DELETION_DATA, { userId });
    const user = data.User_by_pk;
    if (!user) throw new Error('ERROR_USER_NOT_FOUND');

    // Finish external cleanup before clearing paths/email. A failure leaves the
    // information needed to retry, and missing files are safe on a later run.
    for (const subscription of user.OrganizationNewsletterSubscriptions) {
      checkpoint();
      await unsubscribeForAccountDeletion(subscription, user.email);
    }

    checkpoint();
    await removeMatrixAccount(user.matrixUserHandle, logger, userId, Math.min(MATRIX_TIMEOUT_MS, timeLeft()));
    result.steps.matrix_deactivation = true;

    checkpoint();
    const storage = buildCloudStorage(Storage);
    await removeProfileImage(storage, user.picture, req.headers.bucket);
    result.steps.profile_picture_removal = true;

    const certificates = new Set([
      ...user.CourseEnrollments.flatMap((enrollment) => [
        enrollment.achievementCertificateURL, enrollment.attendanceCertificateURL,
      ]),
      ...data.CourseInstructor.map((instructor) => instructor.certificateURL),
    ].filter(Boolean));
    for (const certificate of certificates) {
      checkpoint();
      await deleteFile(storage, certificate, req.headers.bucket);
    }
    result.steps.certificate_anonymization = true;

    // One Hasura mutation is one database transaction. Keep anonymous historical
    // rows and financial documents, but remove personal fields and access grants.
    checkpoint();
    await query(ERASE_PERSONAL_DATA, getErasureVariables(data, userId));
    result.steps.user_data_anonymization = true;
    result.steps.motivation_letter_anonymization = true;

    // Last: preserve a working session for retries until all cleanup has landed.
    const token = await getKeycloakToken();
    try {
      await axios.delete(`${process.env.KEYCLOAK_URL}/admin/realms/edu-hub/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: KEYCLOAK_TIMEOUT_MS,
      });
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }
    result.steps.keycloak_deletion = true;
    result.messageKey = 'ANONYMIZATION_SUCCESS';
  } catch (error) {
    // Never return backend error details containing personal data to the caller.
    logger.error('Account deletion failed', { userId, error: error.code || error.name });
    result.error = 'ERROR_SOME_STEPS_FAILED';
    result.messageKey = 'ANONYMIZATION_PARTIAL_SUCCESS';
  }
  return result;
}

// The existing arbitrary-target action remains admin-only in Hasura and here.
export default async function anonymizeUser(req, logger) {
  if (req.body?.session_variables?.['x-hasura-role'] !== 'admin') {
    return { error: 'UNAUTHORIZED', messageKey: 'UNAUTHORIZED' };
  }
  return eraseAccount(req, logger, req.body?.input?.userId);
}

// No target input: identity comes only from Hasura's verified session variables.
export async function deleteMyAccount(req, logger) {
  const session = req.body?.session_variables;
  if (!['user', 'instructor', 'org_admin', 'admin'].includes(session?.['x-hasura-role']) ||
      !UUID.test(session?.['x-hasura-user-id'] || '')) {
    return { error: 'UNAUTHORIZED', messageKey: 'UNAUTHORIZED' };
  }
  return eraseAccount(req, logger, session['x-hasura-user-id']);
}
