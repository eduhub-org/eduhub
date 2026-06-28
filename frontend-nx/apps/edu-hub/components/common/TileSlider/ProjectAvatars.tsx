import { FC } from 'react';

import { ProjectTileFragment_ProjectAuthors } from '../../../queries/__generated__/ProjectTileFragment';

interface ProjectAvatarsProps {
  authors: ProjectTileFragment_ProjectAuthors[];
  max?: number;
}

const initials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const ProjectAvatars: FC<ProjectAvatarsProps> = ({ authors, max = 3 }) => {
  if (!authors || authors.length === 0) return <span />;
  const shown = authors.slice(0, max);
  const extra = authors.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((author, index) => {
        const user = author.User;
        return (
          <div
            key={author.id}
            className="w-7 h-7 rounded-full border-2 border-fill-primary bg-gray-400 bg-cover bg-center flex items-center justify-center text-[10px] text-white overflow-hidden"
            style={{
              marginLeft: index === 0 ? 0 : -10,
              backgroundImage: user.picture ? `url("${user.picture}")` : undefined,
            }}
            title={`${user.firstName} ${user.lastName}`}
          >
            {!user.picture && initials(user.firstName, user.lastName)}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 border-fill-primary bg-gray-600 flex items-center justify-center text-[10px] text-white"
          style={{ marginLeft: -10 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};
