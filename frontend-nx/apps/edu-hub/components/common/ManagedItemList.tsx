import { FC, useCallback, useMemo, useState, ReactElement } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { Card } from './Card';

interface ManagedItemListProps<T, TSelected> {
  readonly title: string;
  readonly items: readonly T[];
  readonly renderItem: (item: T) => { label: string; sublabel?: string };
  readonly getItemKey: (item: T) => string | number;
  readonly onDelete: (item: T) => Promise<void>;
  readonly onAdd: (confirmed: boolean, selected: TSelected | null) => Promise<void>;
  readonly addButtonLabel: string;
  readonly removeAriaLabel: string;
  readonly SelectionDialog: FC<{
    open: boolean;
    onClose: (confirmed: boolean, selected: TSelected | null) => void;
    title: string;
  }>;
  readonly dialogTitle: string;
  readonly checkDuplicate?: (item: T, selected: TSelected) => boolean;
  readonly additionalDialogProps?: Record<string, unknown>;
}

/**
 * A reusable component for managing lists of items with add/delete functionality.
 * Handles dialog state management, item rendering, and provides consistent UI.
 */
function ManagedItemList<T, TSelected>({
  title,
  items,
  renderItem,
  getItemKey,
  onDelete,
  onAdd,
  addButtonLabel,
  removeAriaLabel,
  SelectionDialog,
  dialogTitle,
  checkDuplicate,
  additionalDialogProps,
}: ManagedItemListProps<T, TSelected>): ReactElement<any> {
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleAdd = useCallback(
    async (confirmed: boolean, selected: TSelected | null) => {
      if (!confirmed || selected == null) {
        closeDialog();
        return;
      }

      // Check for duplicates if checkDuplicate function is provided
      if (checkDuplicate) {
        const isDuplicate = items.some((item) => checkDuplicate(item, selected));
        if (isDuplicate) {
          closeDialog();
          return;
        }
      }

      try {
        await onAdd(confirmed, selected);
      } finally {
        closeDialog();
      }
    },
    [items, onAdd, closeDialog, checkDuplicate]
  );

  const handleDelete = useCallback(
    async (item: T) => {
      try {
        await onDelete(item);
      } catch (error) {
        // Error handling is done by the parent component via useErrorHandler
        console.error('Error deleting item:', error);
      }
    },
    [onDelete]
  );

  // Wrap onAddNewUser to close the selection dialog before opening CreateUserDialog
  const safeAdditionalDialogProps = useMemo(() => {
    const props = additionalDialogProps ?? {};
    const wrapped = { ...props };
    if (typeof wrapped.onAddNewUser === 'function') {
      const original = wrapped.onAddNewUser;
      wrapped.onAddNewUser = (searchValue: string) => {
        closeDialog();
        original(searchValue);
      };
    }
    return wrapped;
  }, [additionalDialogProps, closeDialog]);

  // Filter reserved keys so they cannot be overridden by additionalDialogProps
  const filteredAdditionalProps = useMemo(() => {
    const props = { ...safeAdditionalDialogProps };
    delete props.open;
    delete props.onClose;
    delete props.title;
    return props;
  }, [safeAdditionalDialogProps]);

  return (
    <>
      <Card title={title}>
        <div className="space-y-2">
          {items.map((item) => {
            const { label, sublabel } = renderItem(item);
            return (
              <div key={getItemKey(item)} className="flex items-center justify-between bg-fill-disabled p-2 rounded">
                <div className="flex-1">
                  <div className="font-medium text-label-primary">{label}</div>
                  {sublabel && <div className="text-sm text-label-secondary mt-1">{sublabel}</div>}
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-error hover:opacity-80 p-1 transition-opacity"
                  aria-label={removeAriaLabel}
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            onClick={openDialog}
            className="flex items-center space-x-2 text-brand hover:opacity-90 p-2 w-full rounded hover:bg-fill-disabled transition-colors"
          >
            <MdAddCircle className="w-5 h-5" />
            <span>{addButtonLabel}</span>
          </button>
        </div>
      </Card>

      {dialogOpen && (
        <SelectionDialog
          {...filteredAdditionalProps}
          open={dialogOpen}
          onClose={handleAdd}
          title={dialogTitle}
        />
      )}
    </>
  );
}

export default ManagedItemList;
