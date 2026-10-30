import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentNode } from 'graphql';
import { MdClose } from 'react-icons/md';

import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageRole } from '../../../hooks/authentication';
import { PROGRAM_LIST } from '../../../queries/programList';
import { ProgramList, ProgramListVariables, ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import {
  UPDATE_PROGRAM_APPLICATION_END,
  UPDATE_PROGRAM_APPLICATION_START,
  UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE,
  UPDATE_PROGRAM_LECTURE_END,
  UPDATE_PROGRAM_LECTURE_START,
  UPDATE_PROGRAM_PUBLISHED_VALUE,
  UPDATE_PROGRAM_TITLE,
} from '../../../queries/updateProgram';
import Loading from '../../common/Loading';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import DatePicker from '../../inputs/DatePicker';
import InputField from '../../inputs/InputField';
import ExpandableProgramRow from './ExpandableProgramRow';

// 'Programs' is the program list of the courses page, whose tabs show the program titles.
const REFETCH = ['ProgramList', 'Programs'];

/**
 * A `date` column ("2026-10-01") as local midnight of that day. `new Date()` would read it as UTC
 * midnight, which is the previous day west of UTC. Timestamps are parsed as they are.
 */
const toPickerDate = (value: string | null) => {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value);
};

interface ProgramDateFieldProps {
  label: string;
  value: string | null;
  mutation: DocumentNode;
  dateFieldName: string;
  identifierVariables: Record<string, number>;
  programId: number;
}

const ProgramDateField: FC<ProgramDateFieldProps> = ({
  label,
  value,
  mutation,
  dateFieldName,
  identifierVariables,
  programId,
}) => (
  <div className="min-w-0">
    <span className="block text-xs text-label-secondary mb-1">{label}</span>
    <DatePicker
      variant="material"
      itemId={programId}
      value={toPickerDate(value)}
      updateValueMutation={mutation}
      refetchQueries={REFETCH}
      dateFieldName={dateFieldName}
      identifierVariables={identifierVariables}
    />
  </div>
);

/** Title, publication and dates: the fields the settings page edits in the program table's columns. */
const ProgramBasicsCard: FC<{ program: ProgramList_Program }> = ({ program }) => {
  const t = useTranslations('managePrograms');
  // The table headers of the settings page contain hyphenation for their narrow columns.
  const tLabels = useTranslations('manageCourses.program_settings');
  const manageRole = useManageRole();

  return (
    <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <InputField
            variant="material"
            type="input"
            label={t('title.label')}
            placeholder={t('title.placeholder')}
            helpText={t('title.help_text')}
            itemId={program.id}
            value={program.title || ''}
            updateValueMutation={UPDATE_PROGRAM_TITLE}
            refetchQueries={REFETCH}
          />
        </div>
        <CheckboxSelector
          variant="switch"
          label={tLabels('published')}
          checked={program.published}
          // With the mutation, CheckboxSelector shows the saved snackbar and the error dialog itself.
          updateValueMutation={UPDATE_PROGRAM_PUBLISHED_VALUE}
          identifierVariables={{ programId: program.id }}
          refetchQueries={REFETCH}
          role={manageRole}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ProgramDateField
          label={tLabels('application_start')}
          value={program.applicationStart}
          mutation={UPDATE_PROGRAM_APPLICATION_START}
          dateFieldName="applicationStart"
          identifierVariables={{ programId: program.id }}
          programId={program.id}
        />
        <ProgramDateField
          label={tLabels('application_end')}
          value={program.defaultApplicationEnd}
          mutation={UPDATE_PROGRAM_APPLICATION_END}
          dateFieldName="applicationEnd"
          identifierVariables={{ programId: program.id }}
          programId={program.id}
        />
        <ProgramDateField
          label={tLabels('course_start')}
          value={program.lectureStart}
          mutation={UPDATE_PROGRAM_LECTURE_START}
          dateFieldName="lectureStart"
          identifierVariables={{ programId: program.id }}
          programId={program.id}
        />
        <ProgramDateField
          label={tLabels('course_end')}
          value={program.lectureEnd}
          mutation={UPDATE_PROGRAM_LECTURE_END}
          dateFieldName="lectureEnd"
          identifierVariables={{ programId: program.id }}
          programId={program.id}
        />
        <ProgramDateField
          label={tLabels('project_submission_deadline')}
          value={program.defaultProjectSubmissionDeadline}
          mutation={UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE}
          dateFieldName="value"
          identifierVariables={{ itemId: program.id }}
          programId={program.id}
        />
      </div>
    </div>
  );
};

interface ProgramSettingsPanelProps {
  programId: number;
  onClose: () => void;
}

/**
 * All settings of one program, opened from the courses page: the same fields as the program's row
 * (columns and expanded row) on the programs settings page.
 */
const ProgramSettingsPanel: FC<ProgramSettingsPanelProps> = ({ programId, onClose }) => {
  const t = useTranslations('manageCourses.program_settings');
  const { data, loading, error } = useManageQuery<ProgramList, ProgramListVariables>(PROGRAM_LIST, {
    variables: { where: { id: { _eq: programId } }, limit: 1 },
  });
  const program = data?.Program[0];

  return (
    <section
      aria-label={t('open')}
      className="mb-5 rounded-xl border border-border-primary bg-fill-primary text-label-primary light overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-4">
        <h2 className="text-base font-semibold text-label-primary min-w-0 truncate">
          {t('title', { title: program?.title ?? '' })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="flex-shrink-0 p-1 rounded text-label-secondary hover:text-label-primary hover:bg-fill-secondary"
        >
          <MdClose size={20} />
        </button>
      </div>
      {loading && !program ? (
        <div className="p-6">
          <Loading />
        </div>
      ) : error || !program ? (
        <p className="p-6 text-sm text-error">{t('load_error')}</p>
      ) : (
        <>
          <div className="px-6 pt-4">
            <ProgramBasicsCard program={program} />
          </div>
          <ExpandableProgramRow program={program} />
        </>
      )}
    </section>
  );
};

export default ProgramSettingsPanel;
