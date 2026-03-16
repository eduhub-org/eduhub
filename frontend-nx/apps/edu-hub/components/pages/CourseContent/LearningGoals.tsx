import { FC } from 'react';
import { useTranslations } from 'next-intl';

interface LearningGoalsProps {
  learningGoals: string | null;
}

export const LearningGoals: FC<LearningGoalsProps> = ({ learningGoals }) => {
  const t = useTranslations('course');

  return (
    <>
      {learningGoals !== null && learningGoals.trim() !== '' && (
        <>
          <span className="text-3xl font-semibold mb-9">{t('learning.you_will_learn')}</span>
          <ul className="list-disc pb-12">
            {learningGoals
              .split('\n')
              .filter((goal) => goal.trim() !== '')
              .map((goal, index) => (
                <li key={index} className="pl-6 mb-6">
                  <div className="flex">
                    <img src="/images/course/checkmark.svg" alt="" aria-hidden="true" className="mr-2 inline-block" />
                    <div className="ml-2">
                      {goal.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </>
      )}
    </>
  );
};
