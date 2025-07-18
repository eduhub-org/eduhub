import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { useRoleMutation } from '../../hooks/authedMutation';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { gql } from 'graphql-tag';

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
  // Translation hook - removed t as it's not currently used
  const [content, setContent] = useState(value);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

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
    if (updateValueMutation) {
      updateContent({ variables: { id: itemId, content: newContent } });
    } else if (onValueUpdated) {
      onValueUpdated({ content: newContent });
    }
    setShowSavedNotification(!!updateValueMutation);
  }, 1000);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      debouncedUpdate(newContent);
    },
    [debouncedUpdate]
  );

  const handleVisualEdit = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      handleContentChange(newContent);
    }
  }, [handleContentChange]);

  const handleHtmlEdit = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = event.target.value;
      handleContentChange(newContent);
    },
    [handleContentChange]
  );

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      handleVisualEdit();
      editorRef.current?.focus();
    },
    [handleVisualEdit]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Handle common keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            executeCommand('bold');
            break;
          case 'i':
            event.preventDefault();
            executeCommand('italic');
            break;
          case 'u':
            event.preventDefault();
            executeCommand('underline');
            break;
        }
      }
    },
    [executeCommand]
  );

  const insertPlaceholder = useCallback(
    (placeholder: string) => {
      if (isHtmlMode && textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + placeholder + content.substring(end);
        handleContentChange(newContent);

        // Set cursor position after inserted placeholder
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
          textarea.focus();
        }, 0);
      } else if (editorRef.current) {
        // For visual mode, insert at cursor position in contentEditable
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(placeholder);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Fallback: append to the end
          editorRef.current.appendChild(document.createTextNode(placeholder));
        }
        handleVisualEdit();
        editorRef.current.focus();
      }
    },
    [content, isHtmlMode, handleContentChange, handleVisualEdit]
  );

  const formatButtons = [
    { command: 'bold', icon: <FormatBold />, title: 'Bold (Ctrl+B)' },
    { command: 'italic', icon: <FormatItalic />, title: 'Italic (Ctrl+I)' },
    { command: 'underline', icon: <FormatUnderlined />, title: 'Underline (Ctrl+U)' },
    { command: 'insertUnorderedList', icon: <FormatListBulleted />, title: 'Bullet List' },
    { command: 'insertOrderedList', icon: <FormatListNumbered />, title: 'Numbered List' },
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

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-300 rounded-t-lg">
        {/* View Toggle */}
        <ToggleButtonGroup
          size="small"
          value={isHtmlMode ? 'html' : 'visual'}
          exclusive
          onChange={(_, value) => value && setIsHtmlMode(value === 'html')}
        >
          <ToggleButton value="visual" size="small">
            <Visibility fontSize="small" />
            Visual
          </ToggleButton>
          <ToggleButton value="html" size="small">
            <Code fontSize="small" />
            HTML
          </ToggleButton>
        </ToggleButtonGroup>

        {!isHtmlMode && (
          <>
            <Divider orientation="vertical" flexItem />

            {/* Formatting Buttons */}
            {formatButtons.map((button) => (
              <IconButton
                key={button.command}
                size="small"
                onClick={() => executeCommand(button.command)}
                title={button.title}
              >
                {button.icon}
              </IconButton>
            ))}

            <Divider orientation="vertical" flexItem />

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
          </>
        )}

        {isHtmlMode && (
          <>
            <Divider orientation="vertical" flexItem />
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
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="relative">
        {isHtmlMode ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleHtmlEdit}
            placeholder={placeholder}
            className="w-full h-64 p-4 border-0 resize-none focus:outline-none font-mono text-sm"
            maxLength={maxLength}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleVisualEdit}
            onKeyDown={handleKeyDown}
            className="w-full min-h-64 p-4 focus:outline-none prose max-w-none"
            style={{ minHeight: '16rem' }}
          />
        )}

        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
          {content.length}/{maxLength}
        </div>
      </div>

      {/* Placeholder hint */}
      {!content && !isHtmlMode && (
        <div className="absolute top-20 left-4 text-gray-400 pointer-events-none">{placeholder}</div>
      )}

      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message="notification_snackbar.saved"
      />
    </div>
  );
};

export default EmailEditor;
