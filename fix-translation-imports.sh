#!/bin/bash

# Script to fix next-translate imports to next-intl
# This script will replace all next-translate imports with next-intl equivalents

echo "Fixing next-translate imports to next-intl..."

# Find all files with next-translate imports
files=$(grep -r "next-translate" /home/steffen/git/eduhub/frontend-nx/apps/edu-hub --include="*.tsx" --include="*.ts" -l)

for file in $files; do
    echo "Processing: $file"
    
    # Replace the import statement
    sed -i "s/import useTranslation from 'next-translate\/useTranslation';/import { useTranslations, useLocale } from 'next-intl';/g" "$file"
    
    # Replace usage patterns
    # Pattern 1: const { t, lang } = useTranslation('namespace');
    sed -i "s/const { t, lang } = useTranslation(\([^)]*\));/const t = useTranslations(\1);\n  const { locale } = useLocale();/g" "$file"
    
    # Pattern 2: const { t } = useTranslation('namespace');
    sed -i "s/const { t } = useTranslation(\([^)]*\));/const t = useTranslations(\1);/g" "$file"
    
    # Pattern 3: const { lang } = useTranslation('namespace');
    sed -i "s/const { lang } = useTranslation(\([^)]*\));/const { locale } = useLocale();/g" "$file"
    
    # Replace lang variable usage with locale
    sed -i "s/\blang\b/locale/g" "$file"
done

echo "Done fixing translation imports!"
