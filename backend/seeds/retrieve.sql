SET search_path TO public;

-- Extract sample data from AchievementDocumentationTemplate table (limit to 10 records)

SELECT
    'INSERT INTO "AchievementDocumentationTemplate" (id, title, url, created_at, updated_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(title), 'NULL') || ', ' ||
    COALESCE(quote_literal(url), 'NULL') || ', ' ||
    COALESCE(quote_literal(created_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(updated_at::text), 'NULL') ||
    ');'
FROM "AchievementDocumentationTemplate"
LIMIT 10;