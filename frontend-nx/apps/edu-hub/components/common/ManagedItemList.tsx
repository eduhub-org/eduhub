import { FC, useCallback, useState, ReactElement } from 'react';
import { MdAddCircle } from 'react-icons/md';

interface ManagedItemListProps<T, TSelected> {
  readonly title: string;
  readonly items: readonly T[];
  readonly renderItem: (item: T) => { label: string; sublabel?: string };
  readonly getItemKey: (item: T) => string | number;
  readonly onDelete: (item: T) => Promise<void>;
  readonly onAdd: (confirmed: boolean, selected: TSelected | null) => Promise<void>;
  readonly addButtonLabel: string;
  readonly removeAriaLabel?: string;
  readonly SelectionDialog: FC<{
    open: boolean;
    onClose: (confirmed: boolean, selected: TSelected | null) => void;
    title: string;
  }>;
  readonly dialogTitle: string;
  readonly checkDuplicate?: (item: T, selected: TSelected) => boolean;
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
}: ManagedItemListProps<T, TSelected>): ReactElement {
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => {
          const { label, sublabel } = renderItem(item);
          return (
            <div key={getItemKey(item)} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                {sublabel && <div className="text-sm text-gray-600 mt-1">{sublabel}</div>}
              </div>
              <button
                onClick={() => handleDelete(item)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label={removeAriaLabel}
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          onClick={openDialog}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 w-full rounded hover:bg-blue-50 transition-colors"
        >
          <MdAddCircle className="w-5 h-5" />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      {dialogOpen && (
        <SelectionDialog open={dialogOpen} onClose={handleAdd} title={dialogTitle} />
      )}
    </div>
  );
}

export default ManagedItemList;
