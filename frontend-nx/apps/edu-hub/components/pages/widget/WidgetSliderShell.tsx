import { FC, ReactNode } from 'react';
import Head from 'next/head';
import { ClientOnly } from '@opencampus/shared-components';

import Loading from '../../common/Loading';

interface WidgetSliderShellProps {
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  errorMessage: string;
  emptyMessage: string;
  apiKeyError?: string | null;
  children: ReactNode;
}

/** Shared layout for embeddable widget pages (courses, projects, …). */
export const WidgetSliderShell: FC<WidgetSliderShellProps> = ({
  isLoading,
  hasError,
  isEmpty,
  errorMessage,
  emptyMessage,
  apiKeyError,
  children,
}) => (
  <>
    <Head>
      <meta name="robots" content="noindex, nofollow" />
    </Head>
    <ClientOnly>
      <div className="min-h-[435px] h-[435px] bg-transparent overflow-hidden flex items-center">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <Loading />
          </div>
        ) : hasError ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center text-white">
              <p className="mb-2">{errorMessage}</p>
              {apiKeyError && <p className="text-sm text-red-400">{apiKeyError}</p>}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center text-white">
              <p>{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </ClientOnly>
  </>
);
