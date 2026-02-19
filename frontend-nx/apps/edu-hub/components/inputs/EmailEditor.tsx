import React, { useState, useCallback, useEffect } from 'react';
import { DocumentNode } from 'graphql';
import { Button, IconButton, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  Visibility,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useDebouncedCallback } from 'use-debounce';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../hooks/authedMutation';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { LinkDialog } from '../common/dialogs/LinkDialog';
import { gql } from 'graphql-tag';

/**
 * Determine template category based on template type.
 * ORGANIZER_ADDED uses 'organizer' category (user + course placeholders only, no enrollment dates).
 */
export function getTemplateCategory(templateType?: string): string {
  if (!templateType) return 'enrollment';

  const sessionTemplates = ['SESSION_REMINDER'];
  const enrollmentTemplates = [
    'APPLICATION_RECEIVED',
    'APPLICATION_CONFIRMED',
    'INVITE',
    'DECLINE',
    'REGISTRATION_CONFIRMED',
  ];
  const generalTemplates = ['USER_CREATED'];
  const organizerTemplates = ['ORGANIZER_ADDED'];

  if (sessionTemplates.includes(templateType)) return 'session';
  if (enrollmentTemplates.includes(templateType)) return 'enrollment';
  if (generalTemplates.includes(templateType)) return 'general';
  if (organizerTemplates.includes(templateType)) return 'organizer';

  return 'enrollment';
}

// Configure DOMPurify to allow links while maintaining security
const sanitizeWithLinks = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a',
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
};

interface EmailEditorProps {
  itemId: number;
  value: string;
  updateValueMutation?: DocumentNode;
  refetchQueries?: string[];
  onValueUpdated?: (data: any) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  templateType?: string; // Add templateType prop to filter available variables
}

const EmailEditor: React.FC<EmailEditorProps> = ({
  itemId,
  value,
  updateValueMutation,
  refetchQueries = [],
  onValueUpdated,
  placeholder,
  maxLength = 5000,
  className = '',
  templateType,
}) => {
  const t = useTranslations('common');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  const [updateContent] = useRoleMutation(
    updateValueMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => console.error('Error updating content:', error),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  const debouncedUpdate = useDebouncedCallback((newContent: string) => {
    // Sanitize content before saving to database
    const sanitizedContent = sanitizeWithLinks(newContent);

    if (updateValueMutation) {
      updateContent({ variables: { id: itemId, content: sanitizedContent } });
    } else if (onValueUpdated) {
      onValueUpdated({ content: sanitizedContent });
    }
    setShowSavedNotification(!!updateValueMutation);
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings as they are not needed
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(html);
    },
    immediatelyRender: false,
  });

  const [htmlContent, setHtmlContent] = useState(value);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value, false);
      editor.commands.setTextSelection({ from, to });
    }
    setHtmlContent(value);
  }, [value, editor]);

  const handleHtmlContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    // Sanitize HTML content before setting it
    const sanitizedContent = sanitizeWithLinks(newContent);
    setHtmlContent(sanitizedContent);
    if (editor) {
      editor.commands.setContent(sanitizedContent, false);
    }
  };

  const toggleHtmlMode = () => {
    const newMode = !isHtmlMode;
    setIsHtmlMode(newMode);
    if (newMode) {
      // Entering HTML mode
      setHtmlContent(editor?.getHTML() || '');
    } else {
      // Exiting HTML mode
      editor?.commands.setContent(htmlContent, false);
    }
  };

  const insertPlaceholder = useCallback(
    (text: string) => {
      if (isHtmlMode) {
        // Simple insertion for textarea, can be improved to insert at cursor
        setHtmlContent((prev) => prev + text);
        editor?.commands.setContent(htmlContent + text, false);
      } else {
        editor?.chain().focus().insertContent(text).run();
      }
    },
    [editor, isHtmlMode, htmlContent]
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';
    setCurrentLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkConfirm = useCallback((url: string) => {
    if (!editor) return;

    if (url.trim() === '') {
      // Remove link if URL is empty
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Add or update link
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  }, [editor]);

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const formatButtons = [
    { command: 'toggleBold', icon: <FormatBold />, title: 'Bold (Ctrl+B)' },
    { command: 'toggleItalic', icon: <FormatItalic />, title: 'Italic (Ctrl+I)' },
    { command: 'toggleUnderline', icon: <FormatUnderlined />, title: 'Underline (Ctrl+U)' },
    { command: 'toggleBulletList', icon: <FormatListBulleted />, title: 'Bullet List' },
    { command: 'toggleOrderedList', icon: <FormatListNumbered />, title: 'Numbered List' },
  ];

  // Define all available placeholders with their categories
  const ALL_PLACEHOLDERS = [
    // User variables (available in all contexts)
    { text: '[User:FirstName]', label: 'User Firstname', categories: ['enrollment', 'session', 'general', 'organizer'] },
    { text: '[User:LastName]', label: 'User Lastname', categories: ['enrollment', 'session', 'general', 'organizer'] },

    // Course variables
    { text: '[Enrollment:CourseId--Course:Name]', label: 'Course Name', categories: ['enrollment', 'session', 'organizer'] },
    { text: '[Course:StartTime]', label: 'Course Start', categories: ['enrollment'] },
    { text: '[Course:EndTime]', label: 'Course End', categories: ['enrollment'] },

    // Enrollment variables (only for enrollment emails; organizer uses CourseLink for manage URL)
    { text: '[Enrollment:CreatedAt]', label: 'Application Date', categories: ['enrollment'] },
    { text: '[Enrollment:ExpirationDate]', label: 'Expiration Date', categories: ['enrollment'] },
    { text: '[Enrollment:CourseLink]', label: 'Course Link', categories: ['enrollment', 'session', 'organizer'] },

    // Session variables (only for session reminder emails)
    { text: '[Session:Title]', label: 'Session Title', categories: ['session'] },
    { text: '[Session:StartDateTime]', label: 'Session Start', categories: ['session'] },
    { text: '[Session:Duration]', label: 'Session Duration', categories: ['session'] },
    { text: '[Session:ReminderText]', label: 'Reminder Text', categories: ['session'] },
    { text: '[Session:ReminderTime]', label: 'Reminder Time', categories: ['session'] },

    // System variables (for general emails like user creation)
    { text: '[System:PasswordResetLink]', label: 'Password Reset Link', categories: ['general'] },
    { text: '[System:PortalUrl]', label: 'Portal URL', categories: ['general'] },
  ];

  // Filter placeholders based on template type
  const templateCategory = getTemplateCategory(templateType);
  const allPlaceholders = ALL_PLACEHOLDERS.filter((placeholder) => placeholder.categories.includes(templateCategory));

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-300 rounded-t-lg">
        {/* View Toggle */}
        <ToggleButtonGroup size="small" value={isHtmlMode ? 'html' : 'visual'} exclusive onChange={toggleHtmlMode}>
          <ToggleButton value="visual" size="small">
            <Visibility fontSize="small" />
            Visual
          </ToggleButton>
          <ToggleButton value="html" size="small">
            <Code fontSize="small" />
            HTML
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {!isHtmlMode && (
          <>
            {/* Formatting Buttons */}
            {formatButtons.map((button) => (
              <IconButton
                key={button.command}
                size="small"
                onClick={() => (editor.chain().focus() as any)[button.command]().run()}
                color={editor.isActive(button.command.replace('toggle', '').toLowerCase()) ? 'primary' : 'default'}
                title={button.title}
              >
                {button.icon}
              </IconButton>
            ))}

            {/* Link Button */}
            <IconButton
              size="small"
              onClick={setLink}
              color={editor.isActive('link') ? 'primary' : 'default'}
              title="Add/Edit Link"
            >
              <LinkIcon />
            </IconButton>

            <Divider orientation="vertical" flexItem />
          </>
        )}

        {/* Quick Placeholders */}
        <div className="flex flex-wrap gap-1">
          {allPlaceholders.map((placeholder) => (
            <Button
              key={placeholder.text}
              size="small"
              variant="outlined"
              onClick={() => insertPlaceholder(placeholder.text)}
              sx={{ fontSize: '0.7rem', padding: '2px 6px', minHeight: 'auto' }}
            >
              {placeholder.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlContentChange}
            placeholder={placeholder}
            className="w-full h-64 p-4 border-0 resize-none focus:outline-none font-mono text-sm"
            maxLength={maxLength}
          />
        ) : (
          <EditorContent editor={editor} className="w-full min-h-64 p-4 focus:outline-none prose max-w-none" />
        )}

        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
          {editor.storage.characterCount.characters()}/{maxLength}
        </div>
      </div>

      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />

      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onConfirm={handleLinkConfirm}
        onRemove={handleLinkRemove}
        initialUrl={currentLinkUrl}
        hasExistingLink={!!currentLinkUrl}
      />
    </div>
  );
};

export default EmailEditor;
