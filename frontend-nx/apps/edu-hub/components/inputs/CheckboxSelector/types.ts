import { DocumentNode } from 'graphql';

export type CheckboxSelectorProps = {
  variant: 'material' | 'eduhub';
  label?: string;
  checked: boolean;
  updateValueMutation?: DocumentNode;
  onValueUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
  className?: string;
  identifierVariables?: Record<string, any>;
  /** Prevents interaction; checkbox appears greyed out. */
  disabled?: boolean;
  /** Omits saved snackbar and error dialog (e.g. checkbox lists inside modals). */
  suppressFeedback?: boolean;
};