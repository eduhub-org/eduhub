export const createHandleTagChange = (
  tags: { id: number }[],
  deleteTagFromItem: (id: number) => void,
  insertTagIntoItem: (id: number) => void,
  setTags: React.Dispatch<React.SetStateAction<{ id: number }[]>>,
  refetchCourses: () => void
) => {
  return (_event: React.SyntheticEvent, value: { id: number }[]) => {
    const removedTag = tags.find((tag: { id: number }) => !value.includes(tag));
    const addedTag = value.find((tag: { id: number }) => !tags.includes(tag));

    if (removedTag) {
      deleteTagFromItem(removedTag.id);
    }

    if (addedTag) {
      insertTagIntoItem(addedTag.id);
    }

    setTags(value);
    refetchCourses();
  };
};
