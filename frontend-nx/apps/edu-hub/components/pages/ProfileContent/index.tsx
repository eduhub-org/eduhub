import { FC, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { Button } from '../../common/Button';
import ImageUploader from '../../inputs/ImageUploader';

import { useRoleQuery } from '../../../hooks/authedQuery';
import { useRoleMutation } from '../../../hooks/authedMutation';

import {
  UPDATE_USER_FIRST_NAME,
  UPDATE_USER_LAST_NAME,
  UPDATE_USER_PROFILE_PICTURE,
  UPDATE_USER_OCCUPATION,
  UPDATE_USER_ORGANIZATION_ID,
  UPDATE_USER_EXTERNAL_PROFILE,
  UPDATE_USER_MATRICULATION_NUMBER,
  UPDATE_USER_ZIP_CODE,
  UPDATE_USER_COUNTRY,
} from '../../../queries/updateUser';
import { USER, USER_OCCUPATION } from '../../../queries/user';
import { COUNTRY_LIST } from '../../../queries/country';

import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { User, UserVariables } from '../../../queries/__generated__/User';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import { UserOccupation } from '../../../queries/__generated__/UserOccupation';
import { CREATE_ORGANIZATION, ORGANIZATION_LIST } from '../../../queries/organization';
import {
  MY_ORGANIZATION_NEWSLETTER_OPTIONS,
  UPSERT_ORGANIZATION_NEWSLETTER_SUBSCRIPTION,
} from '../../../queries/newsletterSubscription';
import type { MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription } from '../../../queries/__generated__/MyOrganizationNewsletterOptions';

type NewsletterSubscriptionStatus = MyOrganizationNewsletterOptions_OrganizationNewsletterSubscription['status'];

type NewsletterOrganizationOption = {
  organizationId: number;
  organizationName: string;
  newsletterLabel: string;
  newsletterDescription: string;
  doubleOptInEnabled: boolean;
  status: NewsletterSubscriptionStatus;
};

const ProfileContent: FC = () => {
  const t = useTranslations('profile');
  const { locale } = useRouter();
  const { data: sessionData, status: sessionStatus } = useSession();
  const [showError, setShowError] = useState(true);
  const [newsletterSavingOrgId, setNewsletterSavingOrgId] = useState<number | null>(null);
  const [newsletterSaveError, setNewsletterSaveError] = useState<string | null>(null);

  const {
    data: userData,
    error: userError,
    refetch: refetchUser,
  } = useRoleQuery<User, UserVariables>(USER, {
    variables: {
      userId: sessionData?.profile?.sub,
    },
    skip: !sessionData?.profile?.sub || (sessionStatus as string) === 'loading',
  });

  const queryOccupationOptions = useRoleQuery<UserOccupation>(USER_OCCUPATION, {
    skip: sessionStatus === 'loading',
  });
  const occupationOptions = (queryOccupationOptions.data?.UserOccupation || []).map((x) => ({
    label: t(`occupation.${x.value}`),
    value: x.value,
  }));

  const { data: queryCountryOptions } = useRoleQuery(COUNTRY_LIST, {
    skip: sessionStatus === 'loading',
  });
  // Country options with proper language selection
  const countryOptions = (queryCountryOptions?.Country || []).map((country: { name_de: string; name_en: string; code: string }) => ({
    label: locale === 'de' ? country.name_de : country.name_en,
    value: country.code,
  }));

  const { data: queryOrganizationOptions } = useRoleQuery(ORGANIZATION_LIST, {
    variables: {
      limit: 10000,
      order_by: [{ name: 'asc' }],
    },
  });
  const organizationOptions = queryOrganizationOptions?.Organization?.map((org: { id: number; name: string; aliases?: unknown }) => ({
    value: org.id.toString(),
    label: org.name,
    aliases: org.aliases, // Make sure to include this
  }));

  const [upsertOrganizationNewsletterSubscription] = useRoleMutation(UPSERT_ORGANIZATION_NEWSLETTER_SUBSCRIPTION);

  const {
    data: newsletterOptionsData,
    refetch: refetchNewsletterOptions,
  } = useRoleQuery(MY_ORGANIZATION_NEWSLETTER_OPTIONS, {
    variables: {
      userId: sessionData?.profile?.sub,
    },
    skip: !sessionData?.profile?.sub || (sessionStatus as string) === 'loading',
  });

  const newsletterOptions = useMemo<NewsletterOrganizationOption[]>(() => {
    const hasConfiguredNewsletter = (organization: any): boolean =>
      !!organization?.ghostNewsletterListId || !!organization?.ghostNewsletterSlug;

    const options = new Map<number, NewsletterOrganizationOption>();

    for (const program of newsletterOptionsData?.Program || []) {
      const org = program?.Organization;
      if (!org || !hasConfiguredNewsletter(org)) {
        continue;
      }

      options.set(org.id, {
        organizationId: org.id,
        organizationName: org.name,
        newsletterLabel: org.ghostNewsletterLabel || org.name,
        newsletterDescription: org.newsletterDescription || '',
        doubleOptInEnabled: Boolean(org.ghostNewsletterDoubleOptInEnabled),
        status: 'UNSUBSCRIBED',
      });
    }

    for (const subscription of newsletterOptionsData?.OrganizationNewsletterSubscription || []) {
      const org = subscription?.Organization;
      if (!org) {
        continue;
      }

      const hasConfig = hasConfiguredNewsletter(org);
      if (!hasConfig && subscription.status === 'UNSUBSCRIBED') {
        continue;
      }

      options.set(org.id, {
        organizationId: org.id,
        organizationName: org.name,
        newsletterLabel: org.ghostNewsletterLabel || org.name,
        newsletterDescription: org.newsletterDescription || '',
        doubleOptInEnabled: Boolean(org.ghostNewsletterDoubleOptInEnabled),
        status: subscription.status,
      });
    }

    return [...options.values()].sort((left, right) => left.organizationName.localeCompare(right.organizationName));
  }, [newsletterOptionsData]);

  const handleNewsletterToggle = async (organizationId: number, checked: boolean) => {
    try {
      setNewsletterSaveError(null);
      setNewsletterSavingOrgId(organizationId);
      await upsertOrganizationNewsletterSubscription({
        variables: {
          userId: sessionData?.profile?.sub,
          organizationId,
          status: checked ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
          source: 'PROFILE',
        },
      });
      await refetchNewsletterOptions();
    } catch (error) {
      console.error(error);
      setNewsletterSaveError(t('newsletter_preferences.error'));
    } finally {
      setNewsletterSavingOrgId(null);
    }
  };

  // Render loading state
  if (sessionStatus === 'loading') {
    return <div>Loading...</div>;
  }

  // Render authentication error
  if (!sessionData?.profile?.sub) {
    return <div>Not authenticated</div>;
  }

  // Render query error
  if (userError) {
    return <ErrorMessageDialog errorMessage={userError.message} open={showError} onClose={() => setShowError(false)} />;
  }

  // Log occupation options error but don't block rendering
  if (queryOccupationOptions.error) {
    console.log('query known occupation options error', queryOccupationOptions.error);
  }

  const getOrganizationLabel = (occupation: string) => {
    switch (occupation) {
      case 'HIGH_SCHOOL_STUDENT':
        return t('organization.label_school');
      case 'UNIVERSITY_STUDENT':
        return t('organization.label_university');
      case 'EMPLOYED_FULL_TIME':
      case 'EMPLOYED_PART_TIME':
      case 'SELF_EMPLOYED':
        return t('organization.label_company');
      case 'RESEARCHER':
        return t('organization.label_research');
      case 'EDUCATOR':
        return t('organization.label_education');
      default:
        return t('organization.label_base');
    }
  };

  return (
    <div className="px-3 mt-20">
      <>
        <ImageUploader
          variant="eduhub"
          element="profilePicture"
          identifierVariables={{ userId: sessionData?.profile?.sub ?? '' }}
          currentFile={userData?.User_by_pk?.picture ?? null}
          updateFileMutation={UPDATE_USER_PROFILE_PICTURE}
          onFileUpdated={() => refetchUser()}
          acceptedFileTypes="image/*"
          maxFileSize={5 * 1024 * 1024} // 5MB
          user={userData?.User_by_pk}
        />
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 md:p-0">
            <InputField
              variant="eduhub"
              type="input"
              label={t('first_name')}
              itemId={userData?.User_by_pk?.id}
              value={userData?.User_by_pk?.firstName ?? ''}
              updateValueMutation={UPDATE_USER_FIRST_NAME}
              showCharacterCount={false}
            />
          </div>
          <div className="w-full md:w-1/2 md:p-0">
            <InputField
              variant="eduhub"
              type="input"
              label={t('last_name')}
              itemId={userData?.User_by_pk?.id}
              value={userData?.User_by_pk?.lastName ?? ''}
              updateValueMutation={UPDATE_USER_LAST_NAME}
              showCharacterCount={false}
            />
          </div>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 md:p-0">
            <InputField
              variant="eduhub"
              type="input"
              label={t('zip_code')}
              placeholder={t('zip_code_placeholder')}
              itemId={userData?.User_by_pk?.id}
              value={userData?.User_by_pk?.zipCode || ''}
              updateValueMutation={UPDATE_USER_ZIP_CODE}
              showCharacterCount={false}
            />
          </div>
          <div className="w-full md:w-1/2 md:p-0">
            <DropDownSelector
              variant="eduhub"
              label={t('country')}
              value={userData?.User_by_pk?.country || ''}
              options={countryOptions}
              updateValueMutation={UPDATE_USER_COUNTRY}
              identifierVariables={{ userId: userData?.User_by_pk?.id }}
              nullable={true}
              nullableLabel={t('country_none')}
            />
          </div>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 md:p-0 pb-6">
            <DropDownSelector
              variant="eduhub"
              label={t('occupation.label')}
              value={userData?.User_by_pk?.occupation || ''}
              options={occupationOptions}
              updateValueMutation={UPDATE_USER_OCCUPATION}
              identifierVariables={{ userId: userData?.User_by_pk?.id }}
              nullable={true}
              nullableLabel={t('occupation_none')}
            />
          </div>
          <div className="w-full md:w-1/2 md:p-0">
            <DropDownSelector
              variant="eduhub"
              label={getOrganizationLabel(userData?.User_by_pk?.occupation ?? '')}
              placeholder={t('organization.placeholder')}
              value={userData?.User_by_pk?.Organization?.id?.toString() || ''}
              options={organizationOptions || []}
              updateValueMutation={UPDATE_USER_ORGANIZATION_ID}
              identifierVariables={{ userId: userData?.User_by_pk?.id }}
              creatable={true}
              createOptionMutation={CREATE_ORGANIZATION}
              refetchQueries={['OrganizationList', 'User']}
            />
          </div>
        </div>

        <div className="flex flex-wrap mt-8">
          {userData?.User_by_pk?.occupation === 'UNIVERSITY_STUDENT' && (
            <div className="w-full md:w-1/2 pr-0 md:p-0">
              <InputField
                variant="eduhub"
                type="number"
                label={t('matriculation_number')}
                placeholder={t('matriculation_number_placeholder')}
                itemId={userData?.User_by_pk?.id}
                value={userData?.User_by_pk?.matriculationNumber || ''}
                updateValueMutation={UPDATE_USER_MATRICULATION_NUMBER}
                showCharacterCount={false}
              />
            </div>
          )}
          <div className="w-full md:w-1/2 pr-0 md:p-0">
            <InputField
              variant="eduhub"
              type="link"
              label={t('external_profile')}
              placeholder={t('external_profile_placeholder')}
              itemId={userData?.User_by_pk?.id}
              value={userData?.User_by_pk?.externalProfile || ''}
              updateValueMutation={UPDATE_USER_EXTERNAL_PROFILE}
              showCharacterCount={false}
            />
          </div>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 pl-0 md:pl-3 flex justify-center items-center text-center"></div>
          <div className="w-full md:w-1/2 pl-0 md:pl-3 flex justify-center items-center text-center">
            <Button
              as="a"
              href={`${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/account`}
              target="_blank"
              filled
              inverted
            >
              {t('change_password_or_email')}
            </Button>
          </div>
        </div>

        {newsletterOptions.length > 0 && (
          <div className="mt-8 rounded-xl border border-border-primary/40 bg-fill-primary p-4">
            <h2 className="text-lg font-semibold text-label-primary">{t('newsletter_preferences.title')}</h2>
            <p className="mt-1 text-sm text-label-secondary">{t('newsletter_preferences.description')}</p>

            <div className="mt-4 space-y-4">
              {newsletterOptions.map((newsletterOption) => {
                const isChecked =
                  newsletterOption.status === 'SUBSCRIBED' || newsletterOption.status === 'PENDING';
                const isSaving = newsletterSavingOrgId === newsletterOption.organizationId;

                return (
                  <div key={newsletterOption.organizationId} className="rounded-lg border border-border-primary/30 p-3">
                    <label
                      htmlFor={`profile-newsletter-${newsletterOption.organizationId}`}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        id={`profile-newsletter-${newsletterOption.organizationId}`}
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSaving}
                        onChange={(event) =>
                          handleNewsletterToggle(newsletterOption.organizationId, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <div>
                        <p className="text-sm font-semibold text-label-primary">
                          {t('newsletter_preferences.checkbox_label', {
                            organization: newsletterOption.newsletterLabel,
                          })}
                        </p>
                        {newsletterOption.newsletterDescription && (
                          <p className="text-xs text-label-secondary mt-1">{newsletterOption.newsletterDescription}</p>
                        )}
                        <p className="text-xs text-label-secondary mt-1">
                          {t.rich('newsletter_preferences.legal', {
                            privacy: (chunks) => (
                              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                                {chunks}
                              </Link>
                            ),
                          })}
                        </p>
                        {newsletterOption.doubleOptInEnabled && (
                          <p className="text-xs text-label-secondary mt-1">
                            {t('newsletter_preferences.double_opt_in_notice')}
                          </p>
                        )}
                        {newsletterOption.status === 'ERROR' && (
                          <p className="text-xs text-red-700 mt-1">{t('newsletter_preferences.sync_error')}</p>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            {newsletterSaveError && <p className="mt-3 text-sm text-red-700">{newsletterSaveError}</p>}
          </div>
        )}
      </>
    </div>
  );
};

export default ProfileContent;
