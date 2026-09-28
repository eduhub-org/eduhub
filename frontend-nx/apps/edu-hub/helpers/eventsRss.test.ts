import { buildEventsRss, renderDescriptionFields, RssEvent, selectCurrentEvents } from './eventsRss';

// Stands in for the real ReactMarkdown renderer, whose ESM build Jest cannot load.
const renderMarkdown = (markdown: string) => `<p>${markdown}</p>`;

const NOW = new Date('2026-09-28T10:00:00Z');

const OPTIONS = {
  title: 'EduHub Events',
  description: 'Upcoming events',
  language: 'de',
  baseUrl: 'https://edu.example',
  feedUrl: 'https://edu.example/events/rss.xml',
  renderMarkdown,
  now: NOW,
};

const event = (id: number, sessions: RssEvent['Sessions'], overrides: Partial<RssEvent> = {}): RssEvent => ({
  id,
  title: `Event ${id}`,
  tagline: null,
  created_at: '2026-08-01T12:00:00Z',
  Sessions: sessions,
  ...overrides,
});

describe('selectCurrentEvents', () => {
  it('drops events that finished before today and keeps the rest in upcoming order', () => {
    const past = event(1, [{ startDateTime: '2026-09-20T08:00:00Z', endDateTime: '2026-09-20T10:00:00Z' }]);
    const endedThisMorning = event(2, [{ startDateTime: '2026-09-28T06:00:00Z', endDateTime: '2026-09-28T07:00:00Z' }]);
    const later = event(3, [{ startDateTime: '2026-10-10T08:00:00Z', endDateTime: '2026-10-10T10:00:00Z' }]);
    const sooner = event(4, [{ startDateTime: '2026-10-01T08:00:00Z', endDateTime: null }]);
    const undated = event(5, []);

    const ids = selectCurrentEvents([past, endedThisMorning, later, undated, sooner], NOW).map((e) => e.id);

    expect(ids).toEqual([4, 3, 2, 5]);
  });

  it('keeps an event that ended just after midnight Berlin time', () => {
    // 2026-09-27T22:30Z is 00:30 on the 28th in Berlin, so it still counts as today.
    const justAfterMidnight = event(6, [
      { startDateTime: '2026-09-27T22:00:00Z', endDateTime: '2026-09-27T22:30:00Z' },
    ]);
    expect(selectCurrentEvents([justAfterMidnight], NOW)).toHaveLength(1);
  });
});

describe('buildEventsRss', () => {
  it('renders a valid channel with escaped items linking to the course page', () => {
    const xml = buildEventsRss(
      [
        event(7, [{ startDateTime: '2026-10-01T08:00:00Z', endDateTime: '2026-10-01T15:30:00Z' }], {
          title: 'AI & Society <Kiel>',
          tagline: ' Talks and workshops ',
        }),
      ],
      OPTIONS
    );

    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain('<atom:link href="https://edu.example/events/rss.xml" rel="self"');
    expect(xml).toContain('<title>AI &amp; Society &lt;Kiel&gt;</title>');
    expect(xml).toContain('<link>https://edu.example/course/7</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://edu.example/course/7</guid>');
    expect(xml).toContain('<description>01.10.2026, 10:00 – 17:30 – Talks and workshops</description>');
    expect(xml).toContain('<pubDate>Sat, 01 Aug 2026 12:00:00 GMT</pubDate>');
  });

  it('omits the description when there is neither a date nor a tagline', () => {
    const xml = buildEventsRss([event(8, [])], OPTIONS);
    expect(xml).toContain('<title>Event 8</title>');
    expect(xml).not.toContain('<description></description>');
  });
});

describe('renderDescriptionFields', () => {
  it('renders each field as a heading plus its Markdown body, in page order', () => {
    const html = renderDescriptionFields(
      event(9, [], {
        headingDescriptionField1: 'What & why',
        contentDescriptionField1: 'Talks',
        headingDescriptionField2: 'Agenda',
        contentDescriptionField2: '- Kickoff',
      }),
      renderMarkdown
    );
    expect(html).toBe('<h2>What &amp; why</h2><p>Talks</p><h2>Agenda</h2><p>- Kickoff</p>');
  });

  it('shows a half-filled field once another field is complete, like the course page', () => {
    const html = renderDescriptionFields(
      event(10, [], {
        headingDescriptionField1: 'About',
        contentDescriptionField1: 'Talks',
        contentDescriptionField2: 'Bring a laptop',
      }),
      renderMarkdown
    );
    expect(html).toBe('<h2>About</h2><p>Talks</p><p>Bring a laptop</p>');
  });

  it('returns null when no field has both a heading and content', () => {
    const onlyHeading = event(11, [], { headingDescriptionField1: 'About', contentDescriptionField2: '  ' });
    expect(renderDescriptionFields(onlyHeading, renderMarkdown)).toBeNull();
  });
});

describe('buildEventsRss content:encoded', () => {
  it('wraps the description fields in CDATA and keeps a stray "]]>" from closing it', () => {
    const xml = buildEventsRss(
      [event(12, [], { headingDescriptionField1: 'About', contentDescriptionField1: 'a ]]> b' })],
      OPTIONS
    );
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(xml).toContain('<content:encoded><![CDATA[<h2>About</h2><p>a ]]]]><![CDATA[> b</p>]]></content:encoded>');
  });

  it('leaves content:encoded out when there is nothing to show', () => {
    expect(buildEventsRss([event(13, [])], OPTIONS)).not.toContain('<content:encoded>');
  });
});
