import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();
const mockSaveFile = jest.fn();

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

jest.unstable_mockModule('../../saveFile/index.js', () => ({
  default: mockSaveFile,
}));

const { default: saveProjectDocumentationInstruction } = await import('../index.js');

const OWNER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';

const buildRequest = ({ role, userId, instructionId = 42 }) => ({
  body: {
    session_variables: {
      'x-hasura-role': role,
      ...(userId ? { 'x-hasura-user-id': userId } : {}),
    },
    input: {
      base64file: 'JVBERi0=',
      filename: 'guide.pdf',
      projectDocumentationInstructionId: instructionId,
    },
  },
  headers: {
    bucket: 'test-bucket',
    'file-path':
      'project-docs-instructions/public/instruction-${projectDocumentationInstructionId}/${filename}',
  },
});

const respondWithInstruction = (instruction) =>
  mockGraphqlRequest.mockResolvedValue({
    ProjectDocumentationInstruction_by_pk: instruction,
  });

describe('saveProjectDocumentationInstruction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
    mockSaveFile.mockResolvedValue({
      success: true,
      messageKey: 'FILE_SAVE_SUCCESS',
      filePath: 'project-docs-instructions/public/instruction-42/guide.pdf',
      accessUrl: 'https://example.com/guide.pdf',
    });
  });

  it('lets an admin through without an ownership lookup', async () => {
    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'admin' }),
      mockLogger
    );

    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    expect(mockSaveFile).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('delegates for an instructor who owns the instruction', async () => {
    respondWithInstruction({
      id: 42,
      isDefault: false,
      createdByUserId: OWNER_ID,
    });

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(mockSaveFile).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('refuses an instruction created by someone else and stores nothing', async () => {
    respondWithInstruction({
      id: 42,
      isDefault: false,
      createdByUserId: OTHER_ID,
    });

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    // The whole point of this handler: nothing may reach storage.
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('refuses a platform instruction, which is what makes overwriting impossible', async () => {
    respondWithInstruction({ id: 7, isDefault: false, createdByUserId: null });

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID, instructionId: 7 }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('refuses a default instruction even when the caller created it', async () => {
    respondWithInstruction({
      id: 42,
      isDefault: true,
      createdByUserId: OWNER_ID,
    });

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('reports a missing instruction', async () => {
    respondWithInstruction(null);

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_NOT_FOUND'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('rejects a role that is not admin or instructor', async () => {
    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'user', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('rejects the inherited-role name, which never appears in session variables', async () => {
    // actions.yaml grants `instructor_access`; Hasura resolves that to the request
    // role `instructor`. Accepting the _access spelling here would be a bug.
    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor_access', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('rejects an instructor without a user id', async () => {
    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor' }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_UNAUTHORIZED'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 'abc'])(
    'rejects the invalid instruction id %p',
    async (instructionId) => {
      const result = await saveProjectDocumentationInstruction(
        buildRequest({ role: 'admin', instructionId }),
        mockLogger
      );

      expect(result.messageKey).toBe('INVALID_INPUT');
      expect(mockSaveFile).not.toHaveBeenCalled();
    }
  );

  it('rejects a missing instruction id', async () => {
    const request = buildRequest({ role: 'admin' });
    delete request.body.input.projectDocumentationInstructionId;

    const result = await saveProjectDocumentationInstruction(request, mockLogger);

    expect(result.messageKey).toBe('INVALID_INPUT');
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('surfaces a lookup failure without storing anything', async () => {
    mockGraphqlRequest.mockRejectedValue(new Error('boom'));

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe(
      'SAVE_PROJECT_DOCUMENTATION_INSTRUCTION_LOOKUP_FAILED'
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('reports a misconfigured server without storing anything', async () => {
    delete process.env.HASURA_ADMIN_SECRET;

    const result = await saveProjectDocumentationInstruction(
      buildRequest({ role: 'instructor', userId: OWNER_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe('SERVER_MISCONFIGURED');
    expect(mockSaveFile).not.toHaveBeenCalled();
  });
});
