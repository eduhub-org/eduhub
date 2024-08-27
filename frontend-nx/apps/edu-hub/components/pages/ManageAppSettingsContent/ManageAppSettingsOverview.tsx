import { FC } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { Button } from '../../common/Button';
import FormFieldRow from '../../forms/FormFieldRow';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';

import { UpdateAppSettingsVariables, UpdateAppSettings } from '../../../queries/__generated__/UpdateAppSettings';
import { APP_SETTINGS, UPDATE_APP_SETTINGS } from '../../../queries/appSettings';
import { AppSettings } from '../../../queries/__generated__/AppSettings';
import { COURSE_GROUP_OPTIONS, UPDATE_COURSE_GROUP_OPTION_ORDER } from '../../../queries/courseGroupOptions';
import { CourseGroupOptions } from '../../../queries/__generated__/CourseGroupOptions';
import {
  UpdateCourseGroupOptionOrder,
  UpdateCourseGroupOptionOrderVariables,
} from '../../../queries/__generated__/UpdateCourseGroupOptionOrder';

type Inputs = {
  bannerBackgroundColor: string;
  bannerFontColor: string;
  bannerTextDe: string;
  bannerTextEn: string;
};

const ManageAppSettingsOverview: FC = () => {
  const { data: sessionData } = useSession();
  const { t } = useTranslation();

  const methods = useForm<Inputs>({
    defaultValues: {
      bannerBackgroundColor: '',
      bannerFontColor: '',
      bannerTextDe: '',
      bannerTextEn: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const {
    loading: appSettingsLoading,
    error: appSettingsError,
    refetch: refetchAppSettings,
  } = useAdminQuery<AppSettings>(APP_SETTINGS, {
    variables: { appName: 'edu' },
    onCompleted: (data) => {
      const [appSettings] = data.AppSettings;

      if (appSettings) {
        reset({
          bannerBackgroundColor: appSettings.bannerBackgroundColor,
          bannerFontColor: appSettings.bannerFontColor,
          bannerTextDe: appSettings.bannerTextDe,
          bannerTextEn: appSettings.bannerTextEn,
        });
      }
    },
    skip: !sessionData,
  });

  const { data: courseGroupOptionsData } = useAdminQuery<CourseGroupOptions>(COURSE_GROUP_OPTIONS);

  const [updateAppSettings] = useAdminMutation<UpdateAppSettings, UpdateAppSettingsVariables>(UPDATE_APP_SETTINGS);
  const [updateCourseGroupOptionOrder] = useAdminMutation<
    UpdateCourseGroupOptionOrder,
    UpdateCourseGroupOptionOrderVariables
  >(UPDATE_COURSE_GROUP_OPTION_ORDER);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateAppSettings({
        variables: {
          appName: 'edu',
          bannerBackgroundColor: data.bannerBackgroundColor,
          bannerFontColor: data.bannerFontColor,
          bannerTextDe: data.bannerTextDe,
          bannerTextEn: data.bannerTextEn,
        },
      });

      refetchAppSettings();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update app settings:', error);
      alert('An error occurred while saving the settings. Please try again.');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination || !courseGroupOptionsData) return;

    const reorderedItems = Array.from(courseGroupOptionsData.CourseGroupOption);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    try {
      await Promise.all(
        reorderedItems.map((item, index) =>
          updateCourseGroupOptionOrder({
            variables: {
              id: item.id,
              order: index + 1,
            },
            optimisticResponse: {
              update_CourseGroupOption_by_pk: {
                __typename: 'CourseGroupOption',
                id: item.id,
                order: index + 1,
              },
            },
            update: (cache) => {
              const existingData = cache.readQuery<CourseGroupOptions>({
                query: COURSE_GROUP_OPTIONS,
              });

              if (existingData) {
                const updatedData = {
                  ...existingData,
                  CourseGroupOption: reorderedItems,
                };

                cache.writeQuery({
                  query: COURSE_GROUP_OPTIONS,
                  data: updatedData,
                });
              }
            },
          })
        )
      );
    } catch (error) {
      console.error('Failed to update course group order:', error);
      alert('An error occurred while updating the course group order. Please try again.');
    }
  };

  return (
    <div className="px-3 mt-32 max-w-screen-xl mx-auto">
      {!appSettingsLoading && !appSettingsError ? (
        <>
          <label className="text-xs uppercase tracking-widest font-medium text-gray-400">
            {t('manageAppSettings:appSettings')}
          </label>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-wrap">
                <div className="w-1/2 pr-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:bannerBackgroundColor')}
                    name="bannerBackgroundColor"
                    placeholder="#ffffff"
                    required
                  />
                </div>
                <div className="w-1/2 pl-3">
                  <FormFieldRow<Inputs>
                    label={t('manageAppSettings:bannerFontColor')}
                    name="bannerFontColor"
                    placeholder="#ffffff"
                    required
                    className="w-1/2 pr-3"
                  />
                </div>
              </div>
              <div className="flex flex-wrap">
                <div className="w-1/2 pr-3">
                  <FormFieldRow<Inputs> label={t('manageAppSettings:bannerTextDe')} name="bannerTextDe" />
                </div>
                <div className="w-1/2 pl-3">
                  <FormFieldRow<Inputs> label={t('manageAppSettings:bannerTextEn')} name="bannerTextEn" />
                </div>
              </div>
              <Button
                as="button"
                type="submit"
                disabled={isSubmitting}
                filled
                inverted
                className="mt-8 block mx-auto mb-5 disabled:bg-slate-500"
              >
                {isSubmitting ? t('saving') : t('save')}
              </Button>
            </form>
          </FormProvider>

          <div className="mt-16">
            <label className="text-xs uppercase tracking-widest font-medium text-gray-400">
              {t('manageAppSettings:courseGroupOptions')}
            </label>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="courseGroupOptions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {courseGroupOptionsData?.CourseGroupOption.map((option, index) => (
                      <Draggable key={option.id} draggableId={String(option.id)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-4 border border-gray-300 rounded mb-2 bg-white flex justify-between items-center"
                          >
                            <h2 className="text-xl font-semibold">{t(`start-page:${option.title}`)}</h2>
                            <span className="text-gray-500">{index + 1}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
};

export default ManageAppSettingsOverview;
