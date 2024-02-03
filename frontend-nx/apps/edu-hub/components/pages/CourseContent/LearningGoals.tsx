import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import checkmark from '../../../public/images/course/checkmark.svg';

interface LearningGoalsProps {
  learningGoals: string;
}

export const LearningGoals: FC<LearningGoalsProps> = ({ learningGoals }) => {
  const { t } = useTranslation('course-page');

  return (
    <>
      {learningGoals !== null && learningGoals.trim() !== '' && (
        <>
          <span className="text-3xl font-semibold mb-9">{t('youWillLearn')}</span>
          <ul className="list-disc pb-12">
            {learningGoals
              .split('\n')
              .filter((goal) => goal.trim() !== '')
              .map((goal, index) => (
                <li key={index} className="pl-6 mb-6">
                  <div className="flex align-items-start">
                    <img src={checkmark} alt="check mark" className="mr-2 inline-block" />
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
