# Database Seeds

Seed data is a set of data used to initialize the database with an initial set of values. It is especially useful during development and testing.

## Directory Structure

- `default/` - Contains the seed SQL files that are automatically applied when starting a fresh database
  - `initial_seeds.sql` - Main seed file containing the initial database state
- `utils/` - Utility scripts for managing seeds
  - `export_seeds.sh` - Script to export current database state as seeds

## Default User Seeds

The seed data includes the following users:

- `admin@example.com`
- `user@example.com`
- `instructor@example.com`

The password for all users is `dev`.

## Managing Seed Data

There are two ways to manage seed data:

1. **Temporary Changes**: Use the Hasura console to make temporary changes during development.

2. **Permanent Changes**:
   - The initial database state is defined in `default/initial_seeds.sql`
   - This file is automatically applied when starting a fresh database
   - After making changes to the database that should be persisted, export the current state using the export script (see below)

## Exporting Current Data as Seeds

You can export the current database state as a seed file using the provided script. This is useful when you've made changes to the database that should become the new initial state for fresh installations.

### Usage

```bash
# Navigate to the seeds/utils directory
cd backend/seeds/utils

# Make the script executable (first time only)
chmod +x export_seeds.sh

# Run the export script
./export_seeds.sh
```

### What It Does

The `export_seeds.sh` script:

1. Connects to the Hasura PostgreSQL database container
2. Retrieves all tables from the `public` schema (excluding enum tables and system tables)
3. Uses `hasura-cli seed create` to export all table data
4. Creates or updates `initial_seeds.sql` in the `default/` directory

The exported file contains the current state of all tables in the database and will be automatically applied to fresh database installations.

### Excluded Tables

The script automatically excludes enum tables, reference tables, and system tables:

- `AchievementRecordType`, `AchievementRecordRating`
- `AttendanceStatus`, `AttendanceSource`
- `CourseEnrollmentStatus`, `MotivationRating`
- `LocationOption`, `MailStatus`
- `CertificateType`, `CourseStatus`
- `Employment`, `OrganizationType`
- `University`, `UserOccupation`
- `UserStatus`, `Weekday`, `Language`
- `AppSettings`, `CourseGroupOption`
- `CourseRegistrationType`, `ProgramType`
- `Country` - ISO 3166-1 country codes populated via migration
- `MailTemplate`, `MailTemplateType` - Email templates and template types populated via migrations

These tables are typically managed through migrations rather than seeds. The `Country` table contains static ISO country code data that is populated by a migration (`1753223203000_create_table_public_Country_and_update_user_country`). The `MailTemplate` and `MailTemplateType` tables contain email template data that is populated by migrations (`1745000000000_insert_registration_email_templates`, `1763149035615_add_mail_template_type_enum_and_course_id`, and `1763761969237_insert_email_template_user_creation`).

### FAQ Data Handling

The FAQ tables (`FaqCollection`, `Faq`, `FaqTranslation`) are included in seed exports, but the script automatically filters out FAQ data that is created by migrations to prevent conflicts:

- **Excluded**: The initial "default" FAQ collection and its 3 sample FAQs (created by migrations `1753957404053` and `1753957404056`)
- **Included**: Any additional FAQ collections, FAQs, or translations that you add manually

This allows you to add custom FAQ content via seeds while avoiding conflicts with the migration-created initial FAQ data.

## Requirements

- Docker containers must be running (specifically `eduhub-hasura`)
- Hasura CLI must be available inside the container
- The script expects the PostgreSQL password to be `postgrespassword` (as configured in docker-compose.yml)
