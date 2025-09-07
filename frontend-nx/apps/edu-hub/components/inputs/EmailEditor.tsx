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
} from '@mui/icons-material';
import { useDebouncedCallback } from 'use-debounce';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import { useRoleMutation } from '../../hooks/authedMutation';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { gql } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';

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
  const { t } = useTranslation('common');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

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
    const sanitizedContent = DOMPurify.sanitize(newContent);

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
    const sanitizedContent = DOMPurify.sanitize(newContent);
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
    { text: '[User:Firstname]', label: 'User Firstname', categories: ['enrollment', 'session'] },
    { text: '[User:LastName]', label: 'User Lastname', categories: ['enrollment', 'session'] },

    // Course variables
    { text: '[Enrollment:CourseId--Course:Name]', label: 'Course Name', categories: ['enrollment', 'session'] },
    { text: '[Course:StartTime]', label: 'Course Start', categories: ['enrollment'] },
    { text: '[Course:EndTime]', label: 'Course End', categories: ['enrollment'] },

    // Enrollment variables (only for enrollment emails)
    { text: '[Enrollment:CreatedAt]', label: 'Application Date', categories: ['enrollment'] },
    { text: '[Enrollment:ExpirationDate]', label: 'Expiration Date', categories: ['enrollment'] },
    { text: '[Enrollment:CourseLink]', label: 'Course Link', categories: ['enrollment', 'session'] },

    // Session variables (only for session reminder emails)
    { text: '[Session:Title]', label: 'Session Title', categories: ['session'] },
    { text: '[Session:StartDateTime]', label: 'Session Start', categories: ['session'] },
    { text: '[Session:Duration]', label: 'Session Duration', categories: ['session'] },
    { text: '[Session:ReminderText]', label: 'Reminder Text', categories: ['session'] },
    { text: '[Session:ReminderTime]', label: 'Reminder Time', categories: ['session'] },
  ];

  // Determine template category based on template type
  const getTemplateCategory = (templateType?: string): string => {
    if (!templateType) return 'enrollment'; // Default fallback

    const sessionTemplates = ['SESSION_REMINDER'];
    const enrollmentTemplates = [
      'APPLICATION_RECEIVED',
      'APPLICATION_CONFIRMED',
      'INVITE',
      'DECLINE',
      'REGISTRATION_CONFIRMED',
    ];

    if (sessionTemplates.includes(templateType)) return 'session';
    if (enrollmentTemplates.includes(templateType)) return 'enrollment';

    return 'enrollment'; // Default fallback
  };

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
    </div>
  );
};

export default EmailEditor;
