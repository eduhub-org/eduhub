import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { MdOutlineRateReview } from 'react-icons/md';

interface ProjectReviewCommentProps {
  ratingComment?: string | null;
  /**
   * The project has been (re)submitted since this comment was written, so it
   * documents the previous review round rather than the project's current
   * state. See isProjectReviewCommentFromPreviousRound.
   */
  fromPreviousRound?: boolean;
}

/**
 * The comment the course team left when reviewing the project.
 *
 * It survives a resubmission: the set_project_submitted_metadata trigger keeps
 * ratingComment (while resetting the rating) so the feedback stays readable
 * until the revision has been reviewed, at which point the next verdict
 * replaces it. Once the project is back in review the label says so, so nobody
 * mistakes last round's request for a verdict on the version now submitted.
 */
const ProjectReviewComment: FC<ProjectReviewCommentProps> = ({
  ratingComment,
  fromPreviousRound = false,
}) => {
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
          {t(
            fromPreviousRound
              ? 'projects.my_project.review_comment_label_previous_round'
              : 'projects.my_project.review_comment_label'
          )}
        </p>
        <p className="whitespace-pre-line break-words text-sm text-label-secondary">{comment}</p>
      </div>
    </div>
  );
};

export default ProjectReviewComment;
