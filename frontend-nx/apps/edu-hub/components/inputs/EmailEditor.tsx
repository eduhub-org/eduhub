import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

export type EditorVariable = { text: string; label: string; categories?: string[] };

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
  // StuJo job board mails address employers, not participants, so none of the
  // enrollment placeholders apply to them.
  const jobPostingTemplates = [
    'JOB_POSTING_PUBLISHED',
    'JOB_POSTING_EXPIRED',
    'JOB_POSTING_ADMIN_NOTICE',
    'JOB_POSTING_PAYMENT_FAILED',
  ];

  if (sessionTemplates.includes(templateType)) return 'session';
  if (enrollmentTemplates.includes(templateType)) return 'enrollment';
  if (generalTemplates.includes(templateType)) return 'general';
  if (organizerTemplates.includes(templateType)) return 'organizer';
  if (jobPostingTemplates.includes(templateType)) return 'jobposting';

  return 'enrollment';
}

export const CERTIFICATE_HTML_VARIABLES: EditorVariable[] = [
  { text: '{{ template }}', label: 'Background image' },
  { text: '{{ full_name }}', label: 'Full name' },
  { text: '{{ course_name }}', label: 'Course name' },
  { text: '{{ semester }}', label: 'Program title' },
  { text: '{{ event_entries }}', label: 'Attended sessions (HTML list)' },
  { text: '{{ ECTS }}', label: 'ECTS' },
  { text: '{{ learningGoalsList }}', label: 'Learning goals (achievement)' },
  { text: '{{ praxisprojekt }}', label: 'Project title (achievement)' },
];

const EMAIL_PLACEHOLDERS: EditorVariable[] = [
  { text: '[User:FirstName]', label: 'User Firstname', categories: ['enrollment', 'session', 'general', 'organizer'] },
  { text: '[User:LastName]', label: 'User Lastname', categories: ['enrollment', 'session', 'general', 'organizer'] },
  { text: '[Enrollment:CourseId--Course:Name]', label: 'Course Name', categories: ['enrollment', 'session', 'organizer'] },
  { text: '[Course:StartTime]', label: 'Course Start', categories: ['enrollment'] },
  { text: '[Course:EndTime]', label: 'Course End', categories: ['enrollment'] },
  { text: '[Enrollment:CreatedAt]', label: 'Application Date', categories: ['enrollment'] },
  { text: '[Enrollment:ExpirationDate]', label: 'Expiration Date', categories: ['enrollment'] },
  { text: '[Enrollment:CourseLink]', label: 'Course Link', categories: ['enrollment', 'session', 'organizer'] },
  { text: '[Session:Title]', label: 'Session Title', categories: ['session'] },
  { text: '[Session:StartDateTime]', label: 'Session Start', categories: ['session'] },
  { text: '[Session:Duration]', label: 'Session Duration', categories: ['session'] },
  { text: '[Session:ReminderText]', label: 'Reminder Text', categories: ['session'] },
  { text: '[Session:ReminderTime]', label: 'Reminder Time', categories: ['session'] },
  { text: '[System:PasswordResetLink]', label: 'Password Reset Link', categories: ['general'] },
  { text: '[System:PortalUrl]', label: 'Portal URL', categories: ['general'] },
  // StuJo job board. Substituted by the two local replacers in
  // lib/stripeJobPosting.ts and publishJobPosting/index.js, not by the shared
  // registry in emailTemplateVariables.js.
  { text: '[JobPosting:Title]', label: 'Posting Title', categories: ['jobposting'] },
  { text: '[JobPosting:Type]', label: 'Posting Category', categories: ['jobposting'] },
  { text: '[JobPosting:PublishedAt]', label: 'Published Date', categories: ['jobposting'] },
  { text: '[JobPosting:ExpiresAt]', label: 'Expiry Date', categories: ['jobposting'] },
  { text: '[JobPosting:Payment]', label: 'Payment Summary', categories: ['jobposting'] },
  { text: '[JobPosting:DashboardUrl]', label: 'Employer Dashboard Link', categories: ['jobposting'] },
  { text: '[JobPosting:RepostUrl]', label: 'Repost Link', categories: ['jobposting'] },
  { text: '[JobPosting:AdminUrl]', label: 'Admin Link', categories: ['jobposting'] },
  { text: '[JobPosting:TermsAcceptedAt]', label: 'Terms Accepted Date', categories: ['jobposting'] },
  { text: '[Organization:Name]', label: 'Employer Name', categories: ['jobposting'] },
  { text: '[Invoice:Number]', label: 'Invoice Number', categories: ['jobposting'] },
  { text: '[Invoice:Date]', label: 'Invoice Date', categories: ['jobposting'] },
  { text: '[Invoice:NetTotal]', label: 'Invoice Net', categories: ['jobposting'] },
  { text: '[Invoice:VatRate]', label: 'VAT Rate', categories: ['jobposting'] },
  { text: '[Invoice:VatTotal]', label: 'VAT Amount', categories: ['jobposting'] },
  { text: '[Invoice:GrossTotal]', label: 'Invoice Gross', categories: ['jobposting'] },
  { text: '[Invoice:HostedUrl]', label: 'Invoice Online Link', categories: ['jobposting'] },
  { text: '[Invoice:PaymentStatus]', label: 'Payment Status', categories: ['jobposting'] },
  { text: '[Legal:TermsUrl]', label: 'Terms URL', categories: ['jobposting'] },
  // Conditional blocks, offered as chips so a deleted one can be rebuilt.
  { text: '[#if:Invoice][/if:Invoice]', label: 'Block: has invoice', categories: ['jobposting'] },
  { text: '[#if:InvoicePdf][/if:InvoicePdf]', label: 'Block: PDF attached', categories: ['jobposting'] },
  { text: '[#if:InvoiceLink][/if:InvoiceLink]', label: 'Block: invoice link', categories: ['jobposting'] },
  { text: '[#if:InvoicePending][/if:InvoicePending]', label: 'Block: invoice follows', categories: ['jobposting'] },
  { text: '[#if:TermsAccepted][/if:TermsAccepted]', label: 'Block: consent date', categories: ['jobposting'] },
];

const sanitizeEmailHtml = (content: string): string =>
  DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a',
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });

interface EmailEditorProps {
  itemId: number;
  value: string;
  updateValueMutation?: DocumentNode;
  /** Maps editor content to GraphQL mutation variables (default: { id, content }). */
  updateVariablesMapper?: (content: string, itemId: number) => Record<string, unknown>;
  refetchQueries?: string[];
  onValueUpdated?: (data: unknown) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  templateType?: string;
  /** Override placeholder chips (certificate Jinja variables, etc.). */
  variables?: EditorVariable[];
  /** HTML-only mode: no Visual editor, no DOMPurify (preserves Jinja2). */
  htmlOnly?: boolean;
}

const EmailEditor: React.FC<EmailEditorProps> = ({
  itemId,
  value,
  updateValueMutation,
  updateVariablesMapper,
  refetchQueries = [],
  onValueUpdated,
  placeholder,
  maxLength = 5000,
  className = '',
  templateType,
  variables,
  htmlOnly = false,
}) => {
  const t = useTranslations('common');
  const [isHtmlMode, setIsHtmlMode] = useState(htmlOnly);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTextareaSelectionRef = useRef({ start: 0, end: 0 });

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
        onValueUpdated?.(data);
        setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  const prepareContentForSave = useCallback(
    (newContent: string) => (htmlOnly ? newContent : sanitizeEmailHtml(newContent)),
    [htmlOnly]
  );

  const persistContent = useCallback(
    (newContent: string) => {
      const prepared = prepareContentForSave(newContent);
      if (updateValueMutation) {
        const variablesPayload = updateVariablesMapper
          ? updateVariablesMapper(prepared, itemId)
          : { id: itemId, content: prepared };
        updateContent({ variables: variablesPayload });
      } else if (onValueUpdated) {
        onValueUpdated({ content: prepared });
      }
      setShowSavedNotification(!!updateValueMutation);
    },
    [prepareContentForSave, updateValueMutation, updateVariablesMapper, itemId, updateContent, onValueUpdated]
  );

  const debouncedUpdate = useDebouncedCallback(persistContent, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800 underline' },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      if (!htmlOnly) {
        debouncedUpdate(ed.getHTML());
      }
    },
    immediatelyRender: false,
    editable: !htmlOnly,
  });

  useEffect(() => {
    if (htmlOnly) {
      setHtmlContent(value);
      return;
    }
    if (editor && !editor.isDestroyed) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value, false);
      editor.commands.setTextSelection({ from, to });
    }
    setHtmlContent(value);
  }, [value, editor, htmlOnly]);

  const handleHtmlContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    // Persist the raw value; persistContent sanitizes once via prepareContentForSave.
    setHtmlContent(newContent);
    if (!htmlOnly && editor) {
      editor.commands.setContent(newContent, false);
    }
    debouncedUpdate(newContent);
  };

  const toggleHtmlMode = () => {
    if (htmlOnly) return;
    const newMode = !isHtmlMode;
    setIsHtmlMode(newMode);
    if (newMode) {
      setHtmlContent(editor?.getHTML() || '');
    } else {
      editor?.commands.setContent(htmlContent, false);
    }
  };

  const saveTextareaSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    savedTextareaSelectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }, []);

  const insertIntoTextarea = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? savedTextareaSelectionRef.current.start;
      const end = textarea?.selectionEnd ?? savedTextareaSelectionRef.current.end;
      const newCursorPos = start + text.length;

      setHtmlContent((prev) => {
        const next = prev.slice(0, start) + text + prev.slice(end);
        debouncedUpdate(next);
        return next;
      });

      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(newCursorPos, newCursorPos);
        savedTextareaSelectionRef.current = { start: newCursorPos, end: newCursorPos };
      });
    },
    [debouncedUpdate]
  );

  const insertPlaceholder = useCallback(
    (text: string) => {
      if (isHtmlMode || htmlOnly) {
        insertIntoTextarea(text);
      } else {
        editor?.chain().focus().insertContent(text).run();
      }
    },
    [editor, isHtmlMode, htmlOnly, insertIntoTextarea]
  );

  /** Keep editor/textarea focused so insertions use the current selection, not the end. */
  const handleVariableChipMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    setCurrentLinkUrl(editor.getAttributes('link').href || '');
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkConfirm = useCallback((url: string) => {
    if (!editor) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  }, [editor]);

  const handleLinkRemove = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const formatButtons = [
    { command: 'toggleBold', icon: <FormatBold />, title: 'Bold (Ctrl+B)' },
    { command: 'toggleItalic', icon: <FormatItalic />, title: 'Italic (Ctrl+I)' },
    { command: 'toggleUnderline', icon: <FormatUnderlined />, title: 'Underline (Ctrl+U)' },
    { command: 'toggleBulletList', icon: <FormatListBulleted />, title: 'Bullet List' },
    { command: 'toggleOrderedList', icon: <FormatListNumbered />, title: 'Numbered List' },
  ];

  const templateCategory = getTemplateCategory(templateType);
  const allPlaceholders = useMemo(() => {
    if (variables) return variables;
    return EMAIL_PLACEHOLDERS.filter(
      (ph) => !ph.categories || ph.categories.includes(templateCategory)
    );
  }, [variables, templateCategory]);

  const charCount = htmlOnly
    ? htmlContent.length
    : isHtmlMode
      ? htmlContent.length
      : editor?.storage.characterCount.characters() ?? 0;

  if (!htmlOnly && !editor) {
    return null;
  }

  return (
    <div className={`border border-border-primary rounded-lg light ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-secondary border-b border-border-primary rounded-t-lg text-label-primary">
        {!htmlOnly && (
          <>
            <ToggleButtonGroup
              size="small"
              value={isHtmlMode ? 'html' : 'visual'}
              exclusive
              onChange={toggleHtmlMode}
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'var(--eduhub-label-secondary)',
                  '&.Mui-selected': { color: 'var(--eduhub-brand)' },
                },
              }}
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
            <Divider orientation="vertical" flexItem />
          </>
        )}

        {!htmlOnly && !isHtmlMode && editor && (
          <>
            {formatButtons.map((button) => (
              <IconButton
                key={button.command}
                size="small"
                onClick={() => (editor.chain().focus() as any)[button.command]().run()}
                color={editor.isActive(button.command.replace('toggle', '').toLowerCase()) ? 'primary' : 'default'}
                title={button.title}
                sx={{
                  color: editor.isActive(button.command.replace('toggle', '').toLowerCase())
                    ? undefined
                    : 'var(--eduhub-label-secondary)',
                }}
              >
                {button.icon}
              </IconButton>
            ))}
            <IconButton
              size="small"
              onClick={setLink}
              color={editor.isActive('link') ? 'primary' : 'default'}
              title="Add/Edit Link"
              sx={{ color: editor.isActive('link') ? undefined : 'var(--eduhub-label-secondary)' }}
            >
              <LinkIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem />
          </>
        )}

        <div className="flex flex-wrap gap-1">
          {allPlaceholders.map((ph) => (
            <Button
              key={ph.text}
              size="small"
              variant="outlined"
              onMouseDown={handleVariableChipMouseDown}
              onClick={() => insertPlaceholder(ph.text)}
              sx={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                minHeight: 'auto',
                color: 'var(--eduhub-label-secondary)',
                borderColor: 'var(--eduhub-border-primary)',
              }}
            >
              {ph.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative bg-fill-primary text-label-primary rounded-b-lg">
        {htmlOnly || isHtmlMode ? (
          <textarea
            ref={textareaRef}
            value={htmlContent}
            onChange={handleHtmlContentChange}
            onSelect={saveTextareaSelection}
            onKeyUp={saveTextareaSelection}
            onClick={saveTextareaSelection}
            onBlur={() => debouncedUpdate.flush()}
            placeholder={placeholder}
            className="w-full h-96 p-4 border-0 resize-y focus:outline-none font-mono text-sm bg-fill-primary text-label-primary placeholder:text-label-disabled"
            maxLength={maxLength}
          />
        ) : (
          <EditorContent
            editor={editor!}
            className="w-full min-h-64 p-4 focus:outline-none text-label-primary prose max-w-none prose-headings:text-label-primary prose-p:text-label-primary prose-strong:text-label-primary prose-li:text-label-primary [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-label-primary"
          />
        )}

        <div className="absolute bottom-2 right-2 text-xs text-label-secondary bg-fill-primary px-2 py-1 rounded border border-border-primary">
          {charCount}/{maxLength}
        </div>
      </div>

      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />

      {!htmlOnly && editor && (
        <LinkDialog
          open={linkDialogOpen}
          onClose={() => setLinkDialogOpen(false)}
          onConfirm={handleLinkConfirm}
          onRemove={handleLinkRemove}
          initialUrl={currentLinkUrl}
          hasExistingLink={!!currentLinkUrl}
        />
      )}
    </div>
  );
};

export default EmailEditor;
