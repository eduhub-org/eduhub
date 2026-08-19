import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('graphql-request', () => {
  const actual = jest.requireActual('graphql-request');
  return {
    ...actual,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: mockGraphqlRequest,
    })),
  };
});

const { default: deleteProjectDocumentationInstruction } = await import('../index.js');

const OWNER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';

const buildRequest = ({ role, userId, instructionId = 42 }) => ({
  body: {
    session_variables: {
      'x-hasura-role': role,
      ...(userId ? { 'x-hasura-user-id': userId } : {}),
    },
    input: { instructionId },
  },
});

/**
 * The handler issues up to three requests: look up the row, find the type default,
 * then reassign-and-delete. Queue the responses in that order.
 */
const queueSuccessfulDelete = (instruction, { reassigned = 2 } = {}) => {
  mockGraphqlRequest
    .mockResolvedValueOnce({
      ProjectDocumentationInstruction_by_pk: instruction,
    })
    .mockResolvedValueOnce({ ProjectDocumentationInstruction: [{ id: 9 }] })
    .mockResolvedValueOnce({
      update_Project: { affected_rows: reassigned },
      delete_ProjectDocumentationInstruction_by_pk: { id: instruction.id },
    });
};

describe('deleteProjectDocumentationInstruction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
  });

  it('lets an admin delete a platform instruction', async () => {
    queueSuccessfulDelete({
      id: 42,
      projectTypeValue: 'PROJECT_WITH_LINK',
      isDefault: false,
      createdByUserId: null,
    });

    const result = await deleteProjectDocumentationInstruction(
      buildRequest({ role: 'admin' }),
      mockLogger
    );

    expect(result.success).toBe(true);
    expect(result.reassignedProjectCount).toBe(2);
  });

  it('lets an instructor delete their own instruction', async () => {
    queueSuccessfulDelete({
      id: 42,
      projectTypeValue: 'PROJECT_WITH_LINK',
      isDefault: false,
      createdByUserId: OWNER_ID,
    });

    const result = await deleteProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.success).toBe(true);
  });

  it("refuses another instructor's instruction", async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      ProjectDocumentationInstruction_by_pk: {
        id: 42,
        projectTypeValue: 'PROJECT_WITH_LINK',
        isDefault: false,
        createdByUserId: OTHER_ID,
      },
    });

    const result = await deleteProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe(
      'DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_FORBIDDEN'
    );
    // Only the lookup ran: nothing was reassigned or deleted.
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('refuses a platform instruction for an instructor', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({
      ProjectDocumentationInstruction_by_pk: {
        id: 7,
        projectTypeValue: 'PROJECT_WITH_LINK',
        isDefault: false,
        createdByUserId: null,
      },
    });

    const result = await deleteProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID, instructionId: 7 }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_FORBIDDEN'
    );
    expect(mockGraphqlRequest).toHaveBeenCalledTimes(1);
  });

  it('still refuses a default instruction, for owner and admin alike', async () => {
    for (const request of [
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      buildRequest({ role: 'admin' }),
    ]) {
      jest.clearAllMocks();
      mockGraphqlRequest.mockResolvedValueOnce({
        ProjectDocumentationInstruction_by_pk: {
          id: 42,
          projectTypeValue: 'PROJECT_WITH_LINK',
          isDefault: true,
          createdByUserId: OWNER_ID,
        },
      });

      const result = await deleteProjectDocumentationInstruction(
        request,
        mockLogger
      );

      expect(result.messageKey).toBe(
        'DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_IS_DEFAULT'
      );
    }
  });

  it('rejects roles other than admin and instructor', async () => {
    for (const role of ['user', 'anonymous', 'instructor_access']) {
      jest.clearAllMocks();

      const result = await deleteProjectDocumentationInstruction(
        buildRequest({ role, userId: OWNER_ID }),
        mockLogger
      );

      expect(result.messageKey).toBe(
        'DELETE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
      );
      expect(mockGraphqlRequest).not.toHaveBeenCalled();
    }
  });
});
