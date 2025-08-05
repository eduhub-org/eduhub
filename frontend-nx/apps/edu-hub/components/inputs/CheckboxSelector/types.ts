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
  disabled?: boolean;
};