/**
 * @jest-environment node
 */
import { createUserTools } from './userTools';

/**
 * The Assistant's search_knowledge tool (#2195): offered to every logged-in user, it calls the
 * searchKnowledge action as the asker and hands the model ranked passages with their links.
 */

const respond = (data: unknown) =>
  ({ ok: true, json: async () => ({ data }) }) as unknown as Response;

const PASSAGES = [
  {
    sourceType: 'MANUAL',
    title: 'Anmelden › Wenn der Kurs voll ist',
    url: '/help/participants/registration#wenn-der-kurs-voll-ist',
    content: 'Ist ein Kurs voll belegt, kommst Du auf die Warteliste.',
    language: 'de',
    score: 0.71,
  },
  {
    sourceType: 'CODE',
    title: 'frontend-nx/apps/edu-hub/components/ApplyButton.tsx › ApplyButton',
    url: 'https://github.com/eduhub-org/eduhub/blob/v2.20.0/frontend-nx/apps/edu-hub/components/ApplyButton.tsx#L1-L8',
    content: "if (isFull) return <p>{t('errors.full')}</p>;",
    language: null,
    score: 0.6,
  },
];

const setup = (searchKnowledge: unknown) => {
  const requests: { headers: Record<string, string>; body: any }[] = [];
  const fetchImpl = jest.fn(async (_url: string, init: RequestInit) => {
    requests.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return respond({ searchKnowledge });
  }) as unknown as typeof fetch;
  const tools = createUserTools({ url: 'http://hasura', token: 'alice-token', userId: 'alice', fetchImpl });
  return { tools, requests };
};

describe('search_knowledge', () => {
  it('is offered to every logged-in user, with a strict schema', () => {
    const { tools } = setup({});
    const definition = tools.definitions.find((d) => d.function.name === 'search_knowledge');
    expect(definition?.function.parameters).toMatchObject({
      additionalProperties: false,
      required: ['query'],
    });
  });

  it('searches as the asker and returns ranked passages with their source and link', async () => {
    const { tools, requests } = setup({ success: true, enabled: true, passages: PASSAGES });
    const result = await tools.call('search_knowledge', JSON.stringify({ query: 'Der Kurs ist leider voll belegt', courseId: 12 }));

    expect(result.status).toBe('ok');
    expect(JSON.parse(result.content)).toEqual({
      available: true,
      passages: [
        {
          source: 'EduHub manual',
          title: 'Anmelden › Wenn der Kurs voll ist',
          url: '/help/participants/registration#wenn-der-kurs-voll-ist',
          language: 'de',
          text: 'Ist ein Kurs voll belegt, kommst Du auf die Warteliste.',
        },
        expect.objectContaining({ source: 'source code of the live release', url: PASSAGES[1].url }),
      ],
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].headers).toEqual(expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' }));
    expect(requests[0].body.variables).toEqual({ query: 'Der Kurs ist leider voll belegt', courseId: 12 });
  });

  it('says when the index is off or failing, and rejects arguments it does not know', async () => {
    const { tools } = setup({ success: true, enabled: false, passages: [] });
    expect(JSON.parse((await tools.call('search_knowledge', '{"query":"Warteliste"}')).content)).toEqual({
      available: false,
      passages: [],
    });
    expect((await tools.call('search_knowledge', '{"query":"Warteliste","userId":"bob"}')).status).toBe('invalid');
    expect((await tools.call('search_knowledge', '{"query":"x"}')).status).toBe('invalid');
  });
});
