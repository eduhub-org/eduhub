import { DocumentNode } from 'graphql';

export interface DatePickerProps {
  /**
   * Determines the visual style and behavior of the component.
   * 'material' uses Material-UI components, 'eduhub' uses custom styling.
   */
  variant: 'material' | 'eduhub';

  /**
   * The label text for the date picker field.
   */
  label?: string;

  /**
   * Help text shown in a tooltip to provide additional information.
   */
  helpText?: string;

  /**
   * Unique identifier for the item being edited.
   * This will be mapped to the appropriate mutation variable (e.g., programId).
   * For more complex cases, use identifierVariables instead.
   */
  itemId: number;

  /**
   * The current date value.
   */
  value: Date | null;

  /**
   * GraphQL mutation to update the date.
   * The mutation should accept variables specified in identifierVariables and a date field.
   */
  updateValueMutation?: DocumentNode;

  /**
   * Variables to pass to the mutation (e.g., { programId: 123 }).
   * If not provided, will use { programId: itemId } as default for program mutations.
   */
  identifierVariables?: Record<string, any>;

  /**
   * The name of the date field in the mutation (e.g., 'applicationStart', 'lectureStart', 'applicationEnd').
   * This determines which field name is used when calling the mutation.
   */
  dateFieldName: string;

  /**
   * Callback function called after successful date update.
   * @param data - The data returned from the mutation.
   */
  onValueUpdated?: (data: any) => void;

  /**
   * List of GraphQL query names to refetch after mutation.
   * @default []
   */
  refetchQueries?: string[];

  /**
   * Placeholder text shown when the date picker is empty.
   */
  placeholder?: string;

  /**
   * Whether the date picker is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Minimum selectable date.
   */
  minDate?: Date;

  /**
   * Maximum selectable date.
   */
  maxDate?: Date;

  /**
   * Additional CSS classes to apply to the date picker.
   * @default ''
   */
  className?: string;

  /**
   * Whether to automatically highlight holidays based on app locale.
   * Passed to OptimisticDatePicker.
   * @default true
   */
  showHolidays?: boolean;

  /**
   * Whether to highlight weekends in light blue.
   * Passed to OptimisticDatePicker.
   * @default false
   */
  showWeekends?: boolean;
}

