export const createHandleTagChange = (
  tags: { id: number }[],
  deleteTagFromItem: (id: number) => void,
  insertTagIntoItem: (id: number) => void,
  setTags: React.Dispatch<React.SetStateAction<{ id: number }[]>>,
  refetchCourses: () => void
) => {
  return (event, value) => {
    const removedTag = tags.find((tag) => !value.includes(tag));
    const addedTag = value.find((tag) => !tags.includes(tag));

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
