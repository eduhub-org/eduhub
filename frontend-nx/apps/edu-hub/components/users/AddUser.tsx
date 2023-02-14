import { ChangeEvent, FC, useCallback, useState } from 'react';
import {
  SelectComponentProperty,
  StaticComponentProperty,
} from '../../types/UIComponents';
import EhButton from '../common/EhButton';
import EhCheckBox2 from '../common/EhCheckBox2';
import EhPassword from '../common/EhPassword';
import { useAdminQuery } from '../../hooks/authedQuery';
import {
  UnversityByComment,
  UnversityByComment_University,
} from '../../queries/__generated__/UnversityByComment';
import { UNIVERSITY_LIST } from '../../queries/university';
import Loading from '../courses/Loading';
import { EMPLOYMENT_LIST } from '../../queries/employment';
import {
  EmplomentByValue,
  EmplomentByValue_Employment,
} from '../../queries/__generated__/EmplomentByValue';
import { useAdminMutation } from '../../hooks/authedMutation';
import {
  InsertSingleUser,
  InsertSingleUserVariables,
} from '../../queries/__generated__/InsertSingleUser';
import { INSERT_A_USER } from '../../queries/insertUser';
import {
  Employment_enum,
  University_enum,
} from '../../__generated__/globalTypes';

interface IProps {
  t: any;
  handleCancel: (success: boolean) => void;
}
const AddUser: FC<IProps> = ({ t, handleCancel }) => {
  return (
    <UniversityAndEmploymentStatusLoader t={t} handleCancel={handleCancel} />
  );
};
export default AddUser;

const UniversityAndEmploymentStatusLoader: FC<IProps> = ({
  t,
  handleCancel,
}) => {
  const unersityListRequest =
    useAdminQuery<UnversityByComment>(UNIVERSITY_LIST);

  if (unersityListRequest.error) {
    console.log(unersityListRequest.error);
  }
  const employmentRequest = useAdminQuery<EmplomentByValue>(EMPLOYMENT_LIST);
  if (employmentRequest.error) {
    console.log(employmentRequest.error);
  }

  if (unersityListRequest.loading || employmentRequest.loading) {
    return <Loading />;
  }

  const universites = unersityListRequest.data?.University ?? [];
  const employmentList = employmentRequest.data?.Employment ?? [];

  return (
    <>
      {employmentList.length > 0 && universites.length > 0 && (
        <AddUserForm
          t={t}
          handleCancel={handleCancel}
          universities={universites}
          employmentList={employmentList}
        />
      )}
    </>
  );
};

interface IPropsFrom extends IProps {
  universities: UnversityByComment_University[];
  employmentList: EmplomentByValue_Employment[];
}
const AddUserForm: FC<IPropsFrom> = ({
  t,
  handleCancel,
  universities,
  employmentList,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(Employment_enum.EMPLOYED);
  const [school, setSchool] = useState(University_enum.CAU_KIEL);
  const [studentId, setStudentId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [, setPassword] = useState('');

  const [adminCheckBox, setAdminCheckBox] = useState<StaticComponentProperty>({
    key: 0,
    selected: true,
  });

  const passwordChangeHandler = useCallback(
    (key: number, value: string) => {
      setPassword(value);
    },
    [setPassword]
  );

  const onAdministratorCheck = useCallback(
    (obj: StaticComponentProperty) => {
      obj = { ...obj, selected: !obj.selected };
      setAdminCheckBox(obj);
    },
    [setAdminCheckBox]
  );

  const selectStatus = 1;
  const selectUniversity = 2;
  const onSelectChange = useCallback(
    (key: number, value: string) => {
      switch (key) {
        case selectStatus:
          setStatus(value as Employment_enum);
          break;
        case selectUniversity:
          setSchool(value as University_enum);
          break;
      }
    },
    [setSchool, setStatus]
  );

  const propertyOfUniversityCheckBox: SelectComponentProperty = {
    componentID: selectUniversity,
    onChangeHandler: onSelectChange,
    options: universities,
  };

  const employmentSelectProperty: SelectComponentProperty = {
    componentID: selectStatus,
    onChangeHandler: onSelectChange,
    options: employmentList.map((em) => ({
      value: em.value,
      comment: em.value,
    })),
  };

  const [insertUser, { data, loading, error: insertError }] = useAdminMutation<
    InsertSingleUser,
    InsertSingleUserVariables
  >(INSERT_A_USER);

  // TODO: to complete yet
  const handleSave = useCallback(async () => {
    await insertUser({
      variables: {
        user: {
          id: '895cb63d-fe50-4cf0-9e0d-ca8a48770807',
          Admins: adminCheckBox.selected
            ? {
                data: [
                  {
                    userId: '895cb63d-fe50-4cf0-9e0d-ca8a48770807',
                  },
                ],
              }
            : null,
          firstName,
          lastName,
          email,
          employment: status,
          university: school,
          matriculationNumber: studentId,
          otherUniversity: school !== University_enum.OTHER ? schoolName : null,
        },
      },
    });
    if (data) {
      handleCancel(true);
    }
  }, [
    handleCancel,
    firstName,
    lastName,
    email,
    studentId,
    school,
    status,
    adminCheckBox,
    data,
    schoolName,
    insertUser,
  ]);

  const inputBoxClass =
    'h-15 bg-transparent transition ease-in-out border-b border-solid border-gray-300 focus:border-blue-600 focus:outline-none';
  return (
    <>
      <div className="flex flex-col space-y-5 p-10">
        {insertError ? (
          <div className="pt-8 text-red-500">
            {insertError.graphQLErrors[0].message}
          </div>
        ) : null}
        <div className="grid grid-cols-12 gap-5">
          <div className="flex flex-col space-y-5 col-span-5">
            <span> {t('firstName')} </span>
            <span> {t('lastName')} </span>
            <span> {t('email')} </span>
            <span> {t('password')} </span>
            <span> {t('employmentStatus')} </span>
            <span> {t('university')} </span>
            <span> {t('nameOfUniversity')} </span>
            <span> {t('matriculationNumber')} </span>
            <span> {t('administrator')} </span>
          </div>
          <div className="flex flex-col space-y-5 col-span-7">
            <input
              className={inputBoxClass}
              placeholder={`${t('firstName')}*`}
              value={firstName}
              onChange={useCallback(
                (e: ChangeEvent<HTMLInputElement>) =>
                  setFirstName(e.target.value),
                [setFirstName]
              )}
            />
            <input
              className={inputBoxClass}
              placeholder={`${t('lastName')}*`}
              value={lastName}
              onChange={useCallback(
                (e: ChangeEvent<HTMLInputElement>) =>
                  setLastName(e.target.value),
                [setLastName]
              )}
            />
            <input
              className={inputBoxClass}
              value={email}
              onChange={useCallback(
                (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
                [setEmail]
              )}
              placeholder={`${t('email')}*`}
            />
            <EhPassword
              property={{
                key: 0,
                onChangeHandler: passwordChangeHandler,
                placeHolder: `${t('password')}*`,
              }}
            />
            <UserSelect
              componentProperty={employmentSelectProperty}
              selelectedValue={status}
            />
            <UserSelect
              componentProperty={propertyOfUniversityCheckBox}
              selelectedValue={school}
            />

            <input
              className={inputBoxClass}
              value={schoolName}
              placeholder={`${t('nameOfUniversity')}*`}
              disabled={school !== University_enum.OTHER}
              onChange={useCallback(
                (e: ChangeEvent<HTMLInputElement>) =>
                  setSchoolName(e.target.value),
                [setSchoolName]
              )}
            />

            <input
              className={inputBoxClass}
              value={studentId}
              placeholder={`${t('matriculationNumber')}*`}
              onChange={useCallback(
                (e: ChangeEvent<HTMLInputElement>) => {
                  setStudentId(e.target.value);
                },
                [setStudentId]
              )}
            />
            <EhCheckBox2
              onClickHandler={onAdministratorCheck}
              property={adminCheckBox}
            />
          </div>
        </div>
        <div className="flex justify-center py-5">
          {loading ? (
            <Loading />
          ) : (
            <EhButton buttonText={t('save')} onClickCallback={handleSave} />
          )}
        </div>
      </div>
    </>
  );
};

interface IProsSelect {
  componentProperty: SelectComponentProperty;
  selelectedValue: any;
}

const UserSelect: FC<IProsSelect> = ({
  componentProperty,
  selelectedValue,
}) => {
  const onSelectChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      componentProperty.onChangeHandler(
        componentProperty.componentID,
        event.target.value
      );
    },
    [componentProperty]
  );

  const selectStyle = `form-select 
    appearance
    block
    w-full
    px-3
    font-normal
    bg-transparent
    transition
    ease-in-out
    border-b border-solid border-gray-300
    m-0
    focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none`;
  return (
    <select
      className={selectStyle}
      onChange={onSelectChanged}
      value={selelectedValue ?? ''}
    >
      {componentProperty.options.map((option, index) => (
        <option key={option.value} value={option.value}>
          {option.comment}
        </option>
      ))}
    </select>
  );
};
