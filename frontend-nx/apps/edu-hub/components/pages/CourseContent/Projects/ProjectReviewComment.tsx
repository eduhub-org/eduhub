import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdOutlineRateReview } from 'react-icons/md';

interface ProjectReviewCommentProps {
  ratingComment?: string | null;
}

/**
 * The comment the course team left when reviewing the project.
 *
 * Whatever is stored belongs to the current review round: the
 * set_project_submitted_metadata trigger clears rating/ratingComment when a
 * project re-enters SUBMITTED, so a previous round's verdict never lingers.
 */
const ProjectReviewComment: FC<ProjectReviewCommentProps> = ({ ratingComment }) => {
  const t = useTranslations('course');
  const comment = ratingComment?.trim();

  if (!comment) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-lg border-l-2 border-brand bg-bg-secondary p-4">
      <MdOutlineRateReview className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold text-label-primary">
          {t('projects.my_project.review_comment_label')}
        </p>
        <p className="whitespace-pre-line break-words text-sm text-label-secondary">{comment}</p>
      </div>
    </div>
  );
};

export default ProjectReviewComment;
