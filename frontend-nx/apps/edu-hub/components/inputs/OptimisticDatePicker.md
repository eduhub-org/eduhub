# OptimisticDatePicker Component

A wrapper around `react-datepicker` that provides optimistic updates for better user experience when dealing with async mutations.

## Features

- **Immediate UI feedback**: Date changes are reflected instantly in the UI
- **Error handling**: Automatically rolls back optimistic changes on mutation failure  
- **Loading states**: Optional loading indicators during mutations
- **Common react-datepicker props**: Supports the most commonly used DatePicker props
- **Automatic localization**: Uses next-translate for date format localization
- **Type safety**: Fully typed TypeScript interface

## Basic Usage

```tsx
import OptimisticDatePicker from '../inputs/OptimisticDatePicker';

const MyComponent = () => {
  const [updateDate] = useMutation(UPDATE_DATE_MUTATION);
  
  const handleDateChange = async (date: Date | null) => {
    await updateDate({
      variables: { id: itemId, date: date?.toISOString() }
    });
  };

  return (
    <OptimisticDatePicker
      value={currentDate}
      onChange={handleDateChange}
      showLoading={true}
      className="w-full"
    />
  );
};
```

## Props

### Required Props
- `value: Date | null` - Current date value from server/state
- `onChange: (date: Date | null) => Promise<void> | void` - Date change handler

### Optional Props
- `onError?: (error: Error) => void` - Error callback
- `showLoading?: boolean` - Show loading indicator (default: false)
- `loadingIndicator?: React.ReactNode` - Custom loading component
- `minDate?: Date` - Minimum selectable date
- `maxDate?: Date` - Maximum selectable date
- `className?: string` - CSS class for styling
- `disabled?: boolean` - Disable the input
- `placeholderText?: string` - Placeholder text
- `dateFormat?: string` - Custom date format (defaults to locale-based format)
- `locale?: string` - Custom locale (defaults to next-translate locale)
- Plus other common DatePicker props (id, name, title, autoComplete, etc.)

## Migration Examples

### Before (Manual Optimistic Updates)
```tsx
const [optimisticDate, setOptimisticDate] = useState<Date | null>(null);

const handleChange = async (date: Date | null) => {
  setOptimisticDate(date);
  try {
    await mutation({ variables: { date } });
    await refetch();
  } catch (error) {
    setOptimisticDate(null);
  }
};

<DatePicker
  selected={optimisticDate || serverDate}
  onChange={handleChange}
/>
```

### After (OptimisticDatePicker)
```tsx
const handleChange = async (date: Date | null) => {
  await mutation({ variables: { date } });
  await refetch();
};

<OptimisticDatePicker
  value={serverDate}
  onChange={handleChange}
  showLoading={true}
/>
```

## Use Cases

- Session date editing (implemented)
- Course application deadlines
- Program lecture dates
- Any form with date fields that require server updates

## Benefits

1. **Better UX**: Users see immediate feedback instead of waiting for server response
2. **Reduced complexity**: No need for manual optimistic state management
3. **Error resilience**: Automatic rollback on failures
4. **Consistent behavior**: Standardized optimistic update pattern across the app
