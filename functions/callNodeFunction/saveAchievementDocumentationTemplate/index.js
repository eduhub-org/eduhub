import { Storage } from "@google-cloud/storage";
import { buildCloudStorage } from "../lib/cloud-storage.js";

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const saveAchievementDocumentationTemplate = async (req, res) => {
  if (process.env.HASURA_CLOUD_FUNCTION_SECRET == req.headers.secret) {
    const storage = buildCloudStorage(Storage);
    const content = req.body.input.base64file;
    const achievementDocumentationTemplateId =
      req.body.input.achievementDocumentationTemplateId;
    const filename = req.body.input.filename;
    const isPublic = false;

    const path = `achievementDocumentationTemplateId_${achievementDocumentationTemplateId}/${filename}`;

    const link = await storage.saveToBucket(
      path,
      req.headers.bucket,
      content,
      isPublic
    );

    return res.json({
      path: path,
      google_link: link,
    });
  } else {
    return res.json({
      google_link: "incorrect secret",
      path: "incorrect secret",
    });
  }
};
