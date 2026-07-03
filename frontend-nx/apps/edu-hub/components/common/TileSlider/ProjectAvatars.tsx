import { FC } from 'react';

import { ProjectTileFragment_ProjectAuthors } from '../../../queries/__generated__/ProjectTileFragment';
import { Avatar } from '../../shared-components';

interface ProjectAvatarsProps {
  authors: ProjectTileFragment_ProjectAuthors[];
  max?: number;
  /** Avatar diameter in pixels. */
  size?: number;
}

export const ProjectAvatars: FC<ProjectAvatarsProps> = ({ authors, max = 3, size = 40 }) => {
  if (!authors || authors.length === 0) return <span />;
  const shown = authors.slice(0, max);
  const extra = authors.length - shown.length;
  const overlap = Math.round(size * 0.32);

  return (
    <div className="flex items-center">
      {shown.map((author, index) => {
        const user = author.User;
        return (
          <div key={author.id} style={{ marginLeft: index === 0 ? 0 : -overlap }}>
            <Avatar
              imageUrl={user.picture}
              name={`${user.firstName} ${user.lastName}`}
              size={size}
              className="border-2 border-fill-primary"
            />
          </div>
        );
      })}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full border-2 border-fill-primary bg-bg-card text-label-primary"
          style={{ width: size, height: size, marginLeft: -overlap, fontSize: Math.max(10, Math.round(size * 0.32)) }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};
