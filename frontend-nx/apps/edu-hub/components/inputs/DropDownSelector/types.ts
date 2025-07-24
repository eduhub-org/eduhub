import { DocumentNode } from 'graphql';

export type Option = {
  value: string;
  label: string;
  aliases?: Array<string | { name: string } | null> | null;
};

export type DropDownSelectorProps = {
  variant: 'material' | 'eduhub';
  label?: string;
  placeholder?: string;
  value: string;
  options: Option[];
  updateValueMutation?: DocumentNode;
  onValueUpdated?: (data: any) => void;
  //For the creatable dropdown, we need to specify the query for the optionsto refetch after the option is created
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
  isMandatory?: boolean;
  className?: string;
  identifierVariables?: Record<string, any>;
  creatable?: boolean;
  onOptionCreated?: (newValue: string) => void;
  createOptionMutation?: DocumentNode;
  nullable?: boolean; // Allow clearing selection and convert empty string to null
  nullableLabel?: string; // Custom label for the "none" option
}; 