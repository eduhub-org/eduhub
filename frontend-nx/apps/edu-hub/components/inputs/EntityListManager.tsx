import React, { useState, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import { MdAddCircle } from 'react-icons/md';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import useErrorHandler from '../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { gql } from '@apollo/client';

/**
 * EntityListManager Component
 *
 * This component provides a flexible entity list manager that can operate in two modes:
 * 1. Immediate server update mode
 * 2. Local update mode
 *
 * The mode is determined by the presence or absence of both `insertEntityMutation` and `deleteEntityMutation` props:
 *
 * 1. When both `insertEntityMutation` and `deleteEntityMutation` are provided:
 *    - The component will update the server immediately when entities are added or removed.
 *    - It will call the provided mutations to update the server.
 *    - After successful updates, it will call `onValueUpdated` with the server response.
 *    - It will show a "Saved" notification after each successful update.
 *
 * 2. When either `insertEntityMutation` or `deleteEntityMutation` is not provided:
 *    - The component will not attempt to update the server.
 *    - It will only call `onValueUpdated` with the new entity list.
 *    - No "Saved" notification will be shown.
 *
 * In both modes:
 * - Entity changes trigger appropriate callbacks.
 * - Error messages are displayed if operations fail.
 * - The component supports custom rendering for entity items and selection dialogs.
 *
 * This behavior allows the component to be used in various scenarios:
 * - As a standalone entity manager that immediately persists changes to the server.
 * - As part of a larger form where updates are collected locally and submitted together later.
 */

type EntityListManagerProps<TEntity, TSelectedEntity> = {
  /**
   * Determines the visual style and behavior of the component.
   * 'material' uses Material-UI styling, 'eduhub' uses custom styling.
   */
  variant: 'material' | 'eduhub';

  /**
   * The label for the entity list section.
   */
  label: string;

  /**
   * Text for the "Add" button.
   */
  addButtonText: string;

  /**
   * Unique identifier for the parent item (e.g., course ID).
   */
  itemId: number;

  /**
   * Currently associated entities.
   */
  entities: TEntity[];

  /**
   * Function to render each entity item in the list.
   */
  renderEntity: (entity: TEntity, onDelete: (id: number) => void) => React.ReactNode;

  /**
   * Selection dialog component.
   */
  selectionDialog: React.ReactElement<any>;

  /**
   * Whether the selection dialog is open.
   */
  dialogOpen: boolean;

  /**
   * Function to open the selection dialog.
   */
  onOpenDialog: () => void;

  /**
   * Function to close the selection dialog.
   */
  onCloseDialog: () => void;

  /**
   * Function to handle entity selection from dialog.
   */
  onEntitySelected: (confirmed: boolean, selectedEntity: TSelectedEntity | null) => void;

  /**
   * GraphQL mutation to insert an entity association.
   */
  insertEntityMutation?: DocumentNode;

  /**
   * GraphQL mutation to delete an entity association.
   */
  deleteEntityMutation?: DocumentNode;

  /**
   * Function to build insert mutation variables from selected entity.
   */
  buildInsertVariables?: (itemId: number, selectedEntity: TSelectedEntity) => Record<string, any>;

  /**
   * Function to build delete mutation variables from entity ID.
   */
  buildDeleteVariables?: (itemId: number, entityId: number) => Record<string, any>;

  /**
   * Callback function called after successful entity update.
   */
  onValueUpdated?: (data: any) => void;

  /**
   * List of GraphQL query names to refetch after mutation.
   */
  refetchQueries?: string[];

  /**
   * Text shown in tooltip to provide additional information.
   */
  helpText?: string;

  /**
   * Indicates if the field is required.
   */
  isMandatory?: boolean;

  /**
   * Additional CSS classes to apply to the container.
   */
  className?: string;

  /**
   * If true, inverts the color scheme (for dark mode).
   */
  invertColors?: boolean;
};

const EntityListManager = <TEntity, TSelectedEntity>({
  variant,
  label,
  addButtonText,
  itemId,
  entities,
  renderEntity,
  selectionDialog,
  dialogOpen,
  onOpenDialog,
  onCloseDialog,
  insertEntityMutation,
  deleteEntityMutation,
  buildInsertVariables,
  buildDeleteVariables,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  isMandatory = false,
  className = '',
  invertColors = false,
}: EntityListManagerProps<TEntity, TSelectedEntity>) => {
  const t = useTranslations();
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Insert entity mutation
  const [insertEntity] = useRoleMutation(
    insertEntityMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(t(error.message)),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        if (insertEntityMutation) setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  // Delete entity mutation
  const [deleteEntity] = useRoleMutation(
    deleteEntityMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(t(error.message)),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        if (deleteEntityMutation) setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  // Handle entity deletion
  const handleDeleteEntity = useCallback(
    async (entityId: number) => {
      if (!deleteEntityMutation) {
        // Local mode - just call onValueUpdated
        const updatedEntities = entities.filter((entity: any) => entity.id !== entityId);
        onValueUpdated?.(updatedEntities);
        return;
      }

      // Server update mode
      const deleteVariables = buildDeleteVariables ? buildDeleteVariables(itemId, entityId) : { itemId, entityId };
      await deleteEntity({
        variables: deleteVariables,
      });
    },
    [deleteEntity, deleteEntityMutation, buildDeleteVariables, itemId, entities, onValueUpdated]
  );

  // Handle entity selection
  const handleEntitySelection = useCallback(
    async (confirmed: boolean, selectedEntity: TSelectedEntity | null) => {
      if (!confirmed || !selectedEntity) {
        onCloseDialog();
        return;
      }

      if (!insertEntityMutation) {
        // Local mode - just call onValueUpdated
        const updatedEntities = [...entities, selectedEntity];
        onValueUpdated?.(updatedEntities);
        onCloseDialog();
        return;
      }

      // Server update mode
      const insertVariables = buildInsertVariables
        ? buildInsertVariables(itemId, selectedEntity)
        : { itemId, entityId: (selectedEntity as any).id };
      await insertEntity({
        variables: insertVariables,
      });

      onCloseDialog();
    },
    [insertEntity, insertEntityMutation, buildInsertVariables, itemId, entities, onValueUpdated, onCloseDialog]
  );

  // Create a modified dialog that uses our handler
  const enhancedDialog = React.cloneElement(selectionDialog, {
    onClose: handleEntitySelection,
  });

  const baseClasses = `space-y-4 ${className}`;
  const containerClasses =
    variant === 'material' ? baseClasses : `${baseClasses} ${invertColors ? 'text-white' : 'text-gray-900'}`;

  return (
    <>
      <div className={containerClasses}>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {label}
          {isMandatory && <span className="text-red-500 ml-1">*</span>}
          {helpText && (
            <span className="ml-2 text-gray-400 cursor-help" title={helpText}>
              ℹ️
            </span>
          )}
        </h4>

        <div className="space-y-2">
          {entities.map((entity, index) => (
            <div key={`${itemId}-${(entity as any).id || index}`}>{renderEntity(entity, handleDeleteEntity)}</div>
          ))}

          <button
            onClick={onOpenDialog}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 w-full"
          >
            <MdAddCircle className="w-5 h-5" />
            <span>{addButtonText}</span>
          </button>
        </div>
      </div>

      {/* Selection Dialog */}
      {dialogOpen && enhancedDialog}

      {/* Error Message Dialog */}
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}

      {/* Success Notification */}
      {showSavedNotification && (
        <NotificationSnackbar
          open={showSavedNotification}
          onClose={() => setShowSavedNotification(false)}
          message={t('common.saved')}
        />
      )}
    </>
  );
};

export default EntityListManager;
