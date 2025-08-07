# Agent Usage Guide: Translation Management in EduHub

## Overview

This guide documents how to effectively use AI agents for translation management in the EduHub project, based on a comprehensive reorganization of CourseContent component translations. The project follows specific conventions for internationalization (i18n) with React components using next-translate.

## Project Context

**EduHub** is an educational platform with a React/Next.js frontend located in `frontend-nx/apps/edu-hub/`. The application supports multiple languages (German and English) with translations organized by component functionality.

### Key Translation Principles

1. **Component-based organization** - Translations grouped by UI component functionality
2. **Snake_case naming** - All translation keys use snake_case convention
3. **German informal "Du"** - MANDATORY use of informal pronouns in German
4. **Logical grouping** - Related translations organized into nested objects

## Agent Capabilities for Translation Tasks

### 1. Translation File Analysis and Consolidation

**Use Case**: Reorganizing scattered translations into logical component-based files

**Agent Approach**:
```bash
# Search for translation usage across components
grep -r "useTranslation\|t(" frontend-nx/apps/edu-hub/components/pages/CourseContent/

# Identify translation namespaces and keys
grep -r "course-page\|course-application\|achievements-page" frontend-nx/apps/edu-hub/locales/
```

**Expected Output**: Comprehensive mapping of which components use which translations, identifying consolidation opportunities.

### 2. Translation Key Migration

**Use Case**: Converting camelCase keys to snake_case and updating component references

**Agent Process**:
1. **Analyze existing keys**: Scan translation files for naming inconsistencies
2. **Generate migration map**: Create mapping from old keys to new snake_case keys
3. **Update components**: Systematically update all component translation calls
4. **Validate changes**: Ensure no broken translation references

**Example Migration**:
```typescript
// Before
t('course-page:learningGoals')
t('course-application:applyNow')

// After  
t('course:learning.you_will_learn')
t('course:registration.apply_now')
```

### 3. German Language Consistency Enforcement

**Use Case**: Ensuring all German translations use informal "Du" variant

**Agent Validation Process**:
```typescript
// Check for formal German pronouns
const formalPronouns = ['Sie können', 'Sie werden', 'Ihre ', 'Ihnen', 'geben Sie'];
const informalCorrections = ['Du kannst', 'Du wirst', 'Deine ', 'Dir', 'gib'];
```

**Quality Assurance Checklist**:
- ✅ No "Sie/Ihnen/Ihre" formal pronouns
- ✅ Consistent informal verb conjugations  
- ✅ Proper possessive pronouns (dein/deine)
- ✅ Friendly, approachable tone

### 4. Translation Structure Optimization

**Use Case**: Organizing translations into logical groups for better maintainability

**Recommended Structure**:
```json
{
  "general": { /* Common elements */ },
  "ects": { /* Credit values */ },
  "degree_elements": { /* Program information */ },
  "learning": { /* Learning goals */ },
  "sessions": { /* Course sessions */ },
  "attendances": { /* Attendance tracking */ },
  "achievement": { /* Achievement records */ },
  "registration": { /* Registration flow */ },
  "status": { /* Enrollment statuses */ },
  "modal": { /* Modal dialogs */ },
  "errors": { /* Error messages */ },
  "onboarding_modal": { /* Onboarding flow */ },
  "success_messages": { /* Success notifications */ }
}
```

## Common Agent Tasks and Solutions

### Task 1: Consolidate Scattered Translations

**Problem**: Translations for a single component spread across multiple files
**Solution**: 
1. Identify all translation files containing component-related keys
2. Create consolidated structure in primary component file
3. Update all component imports to use single namespace
4. Remove duplicates from original files

### Task 2: Fix Dynamic Translation Access

**Problem**: ECTS values with dots/commas not accessible via dot notation
**Solution**:
```typescript
// Use returnObjects for dynamic key access
const { t: tCourse } = useTranslation('course');
const ectsTranslations = tCourse('ects', { returnObjects: true });
const ectsValue = ectsTranslations[course.ects]; // Works with "2,5", "12,5" etc.
```

### Task 3: Component Documentation Updates

**Problem**: READMEs and documentation outdated after translation changes
**Solution**:
1. Update namespace references in component documentation
2. Reflect current translation structure in examples
3. Add JSDoc comments to components explaining translation usage
4. Update integration examples with correct translation keys

### Task 4: Translation File Cleanup

**Problem**: Duplicate translations across multiple files after consolidation
**Solution**:
1. Identify which translations were moved to consolidated files
2. Remove duplicates while preserving unique translations
3. Maintain translations still used by other components
4. Verify no components reference removed translations

## Agent Workflow for Translation Projects

### Phase 1: Discovery and Analysis
1. **Map component structure** - Understand which components need translations
2. **Analyze current translation files** - Identify scattered or duplicate translations
3. **Document translation usage** - Create mapping of components to translation keys
4. **Identify inconsistencies** - Find naming convention violations or language issues

### Phase 2: Planning and Validation
1. **Create consolidation plan** - Determine target file structure
2. **Generate key migration map** - Plan snake_case conversions
3. **Validate German translations** - Check for formal language usage
4. **Plan component updates** - Identify all files requiring changes

### Phase 3: Implementation
1. **Update translation files** - Consolidate and reorganize translations
2. **Migrate component code** - Update all translation calls
3. **Fix dynamic access patterns** - Handle special cases like ECTS values
4. **Update documentation** - Reflect changes in READMEs and comments

### Phase 4: Quality Assurance
1. **Test translation loading** - Verify all keys resolve correctly
2. **Validate German language** - Ensure consistent informal usage
3. **Check component functionality** - Test UI elements display correctly
4. **Review documentation** - Ensure accuracy of updated docs

## Best Practices for Agent-Assisted Translation Work

### 1. Systematic Approach
- Always analyze before making changes
- Create comprehensive plans before implementation
- Update related documentation simultaneously
- Test changes incrementally

### 2. Consistency Enforcement
- Use automated checks for naming conventions
- Validate language consistency (German "Du" usage)
- Maintain logical grouping in translation files
- Follow established project patterns

### 3. Component Integration
- Understand component hierarchy and relationships
- Consider impact on parent/child component communication
- Maintain backward compatibility where possible
- Update all related documentation

### 4. Error Prevention
- Validate translation key references before deletion
- Test dynamic translation access patterns
- Check for edge cases in translation usage
- Maintain fallback strategies for missing translations

## File Structure Reference

### Translation Files Location
```
frontend-nx/apps/edu-hub/locales/
├── de/                     # German translations
│   ├── course.json        # CourseContent components
│   ├── course-page.json   # Management/admin components
│   └── common.json        # Shared translations
└── en/                     # English translations
    ├── course.json        # CourseContent components  
    ├── course-page.json   # Management/admin components
    └── common.json        # Shared translations
```

### Component Structure
```
frontend-nx/apps/edu-hub/components/pages/CourseContent/
├── index.tsx                           # Main course display
├── Registration/                       # Registration flow
│   ├── RegistrationButton.tsx        # Apply/register buttons
│   ├── RegistrationModal.tsx         # Application modal
│   └── RegistrationStatus.tsx        # Enrollment status display
├── AchievementRecord/                 # Achievement management
├── Sessions.tsx                       # Course session display
└── TimeLocationLanguageInstructors.tsx # Course details
```

## Troubleshooting Common Issues

### Issue 1: Translation Not Loading
**Symptoms**: Component shows translation key instead of text
**Solution**: 
1. Verify namespace matches filename
2. Check key exists in translation file
3. Validate JSON syntax
4. Ensure component imports correct namespace

### Issue 2: German Formal Language
**Symptoms**: German text uses "Sie" instead of "Du"
**Solution**:
1. Search for formal pronouns: `Sie`, `Ihnen`, `Ihre`
2. Replace with informal equivalents: `Du`, `Dir`, `Deine`
3. Update verb conjugations to match informal usage
4. Review for consistent tone

### Issue 3: Dynamic Key Access Fails
**Symptoms**: Translation with dots/special characters not working
**Solution**:
```typescript
// Instead of: t(`ects.${value}`)
// Use: 
const translations = t('ects', { returnObjects: true });
const result = translations[value];
```

### Issue 4: Nested Translation Structure
**Symptoms**: Deeply nested translations hard to maintain
**Solution**:
1. Group related translations logically
2. Limit nesting to 2-3 levels maximum
3. Use descriptive group names
4. Consider component-based organization

## Success Metrics

When using agents for translation management, measure success by:

1. **Consistency**: All translation keys follow snake_case convention
2. **Organization**: Translations logically grouped by component functionality  
3. **Language Quality**: German translations consistently use informal "Du"
4. **Maintainability**: Clear structure enables easy future updates
5. **Documentation**: Comprehensive docs reflect current implementation
6. **Functionality**: All UI elements display correct translations

## Conclusion

Effective agent usage for translation management requires understanding both the technical implementation (React/next-translate) and the project-specific conventions (snake_case keys, German informal language, component-based organization). By following this systematic approach, agents can successfully consolidate, organize, and maintain translation files while ensuring consistency and quality across the application.

The key to success is thorough analysis before implementation, systematic execution of changes, and comprehensive validation of results. This approach ensures translation management enhances rather than disrupts the user experience. 