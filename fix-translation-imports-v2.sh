#!/bin/bash

# Script to fix next-translate imports to next-intl
# This script will replace all next-translate imports with next-intl equivalents

echo "Fixing next-translate imports to next-intl..."

# Find all files with next-translate imports
files=$(find /home/steffen/git/eduhub/frontend-nx/apps/edu-hub -name "*.tsx" -o -name "*.ts" | xargs grep -l "next-translate")

for file in $files; do
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Replace the import statement
    sed -i "s/import useTranslation from 'next-translate\/useTranslation';/import { useTranslations, useLocale } from 'next-intl';/g" "$file"
    
    # Handle different usage patterns
    # Pattern 1: const { t, lang } = useTranslation('namespace');
    sed -i "s/const { t, lang } = useTranslation(\([^)]*\));/const t = useTranslations(\1);\n  const { locale } = useLocale();/g" "$file"
    
    # Pattern 2: const { t } = useTranslation('namespace');
    sed -i "s/const { t } = useTranslation(\([^)]*\));/const t = useTranslations(\1);/g" "$file"
    
    # Pattern 3: const { lang } = useTranslation('namespace');
    sed -i "s/const { lang } = useTranslation(\([^)]*\));/const { locale } = useLocale();/g" "$file"
    
    # Pattern 4: const { t, lang } = useTranslation();
    sed -i "s/const { t, lang } = useTranslation();/const t = useTranslations('common');\n  const { locale } = useLocale();/g" "$file"
    
    # Pattern 5: const { t } = useTranslation();
    sed -i "s/const { t } = useTranslation();/const t = useTranslations('common');/g" "$file"
    
    # Replace lang variable usage with locale (but be careful not to replace in strings)
    sed -i "s/\blang\b/locale/g" "$file"
    
    # Clean up any double imports
    sed -i '/import { useTranslations, useLocale } from '\''next-intl'\'';/,/import { useTranslations, useLocale } from '\''next-intl'\'';/{
        N
        s/import { useTranslations, useLocale } from '\''next-intl'\'';\nimport { useTranslations, useLocale } from '\''next-intl'\'';/import { useTranslations, useLocale } from '\''next-intl'\'';/
    }' "$file"
done

echo "Done fixing translation imports!"
echo "Backup files created with .backup extension"
