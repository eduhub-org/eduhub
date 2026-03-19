import { FC, useEffect, useMemo, useState } from "react";
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

import { Button } from "../../common/Button";
import { AdminCourseList_Course } from "../../../queries/__generated__/AdminCourseList";
import { useRoleMutation } from "../../../hooks/authedMutation";
import { CREATE_MATRIX_ROOM } from "../../../queries/matrix";

interface CreateMatrixRoomDialogProps {
  open: boolean;
  course: AdminCourseList_Course;
  onClose: () => void;
}

const mapErrorToMessage = (
  messageKey: string | null | undefined,
  fallback: string,
  t: (key: string) => string
) => {
  if (messageKey === "MATRIX_CONFIG_MISSING") return t("manageCourses.matrix_room.error_no_config");
  if (messageKey === "MATRIX_INVALID_INPUT") return t("manageCourses.matrix_room.error_invalid_input");
  return `${t("manageCourses.matrix_room.error_creation_failed")}: ${fallback}`;
};

const buildElementLink = (roomId: string | null | undefined) => {
  const elementBaseUrl = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL?.replace(/\/+$/, "");
  if (!elementBaseUrl || !roomId) return "";
  return `${elementBaseUrl}/#/room/${roomId}`;
};

const CreateMatrixRoomDialog: FC<CreateMatrixRoomDialogProps> = ({ open, course, onClose }) => {
  const t = useTranslations();
  const [roomName, setRoomName] = useState("");
  const [topic, setTopic] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  const [createMatrixRoom, { loading }] = useRoleMutation(CREATE_MATRIX_ROOM);

  const hasProgramSpace = Boolean((course.Program as any)?.matrixSpaceId);
  const hasCourseRoom = Boolean((course as any).matrixRoomId);

  const existingRoomLink = useMemo(() => {
    const matrixLink = buildElementLink((course as any).matrixRoomId);
    if (matrixLink) return matrixLink;
    return course.chatLink || "";
  }, [course]);

  useEffect(() => {
    if (!open) return;
    const shortTitle = course.Program?.shortTitle || "";
    const title = course.title || "";
    setRoomName([shortTitle, title].filter(Boolean).join(" | "));
    setSpaceName(shortTitle || "");
    setTopic("");
    setError(null);
    setSuccessLink(null);
  }, [open, course.Program?.shortTitle, course.title]);

  const handleCreate = async () => {
    setError(null);
    try {
      const result = await createMatrixRoom({
        variables: {
          courseId: course.id,
          roomName: roomName.trim(),
          topic: topic.trim() || null,
          spaceName: hasProgramSpace ? null : (spaceName.trim() || null),
        },
        refetchQueries: ["AdminCourseList"],
        awaitRefetchQueries: true,
      });

      const payload = result?.data?.createMatrixRoom;
      if (payload?.success) {
        setSuccessLink(payload.chatLink || buildElementLink(payload.roomId));
        return;
      }

      const fallbackError = payload?.error || t("manageCourses.matrix_room.error_unknown");
      setError(mapErrorToMessage(payload?.messageKey, fallbackError, t));
    } catch (err: any) {
      setError(mapErrorToMessage(undefined, err.message || t("manageCourses.matrix_room.error_unknown"), t));
    }
  };

  const canSubmit =
    roomName.trim().length > 0 && (hasProgramSpace || spaceName.trim().length > 0) && !loading;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="light">{t("manageCourses.matrix_room.dialog_title")}</DialogTitle>
      <DialogContent className="light">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {hasCourseRoom && (
            <Alert severity="info">
              {t("manageCourses.matrix_room.button_room_exists")}
              {existingRoomLink ? (
                <>
                  {" "}
                  <a href={existingRoomLink} target="_blank" rel="noreferrer" className="underline">
                    {t("manageCourses.matrix_room.open_in_element")}
                  </a>
                </>
              ) : null}
            </Alert>
          )}

          {!hasCourseRoom && !hasProgramSpace && (
            <Alert severity="info">{t("manageCourses.matrix_room.space_will_be_created_hint")}</Alert>
          )}

          {!hasCourseRoom && !hasProgramSpace && (
            <TextField
              label={t("manageCourses.matrix_room.space_name_label")}
              value={spaceName}
              onChange={(event) => setSpaceName(event.target.value)}
              fullWidth
              size="small"
            />
          )}

          {!hasCourseRoom && (
            <>
              <TextField
                label={t("manageCourses.matrix_room.room_name_label")}
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={t("manageCourses.matrix_room.description_label")}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
            </>
          )}

          {successLink && (
            <Alert severity="success">
              <Typography variant="body2">
                {t("manageCourses.matrix_room.success_created")}{" "}
                <a href={successLink} target="_blank" rel="noreferrer" className="underline">
                  {t("manageCourses.matrix_room.open_in_element")}
                </a>
              </Typography>
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions className="light">
        <Button onClick={onClose}>{t("manageCourses.cancel")}</Button>
        {!hasCourseRoom && (
          <Button filled onClick={handleCreate} disabled={!canSubmit}>
            {loading
              ? t("manageCourses.matrix_room.button_creating")
              : t("manageCourses.matrix_room.button_create")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateMatrixRoomDialog;
