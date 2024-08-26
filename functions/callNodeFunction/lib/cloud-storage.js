import fs from "fs";
import logger from "../index.js";
import path from "path";
import url from "url";

const isPublicLegacy = (filePath) => filePath.startsWith("https://") || filePath.startsWith("http://");
const isPublic = (filePath) => filePath.includes("/public/");

const getRelativePath = (filePath) => {
  if (isPublicLegacy(filePath)) {
    const parsedUrl = url.parse(filePath);
    const pathParts = parsedUrl.pathname.split('/');
    return pathParts.slice(pathParts.indexOf('public')).join('/');
  }
  return filePath;
};

export const buildCloudStorage = (Storage) => {
  const emulated = process.env.ENVIRONMENT == "development";

  if (emulated) {
    const www = "/home/node/www/";
    return {
      saveToBucket: async (filename, bucketName, content, isPublic) => {
        try {
          filename = getRelativePath(filename);
          const tokens = filename.split("/");
          const returnPath = [...tokens.slice(0, tokens.length - 1)].join("/");
          const fpath = [bucketName, returnPath].join("/");
          const fname = tokens[tokens.length - 1];
  
          await fs.promises.mkdir(www + fpath, { recursive: true });
          logger.debug(`saveToBucket: Directory created at ${www + fpath}`);
 
          const fullPath = fpath + "/" + fname; 
          await fs.promises.writeFile(www + fullPath,Buffer.from(content, "base64"));
          logger.debug(`saveToBucket: File written to ${www + fullPath}`);
 
          return encodeURI("/" + returnPath + "/" + fname);
        } catch (error) {
          logger.error(`Error in saveToBucket: ${error.message}`);
          throw error;
        } 
      },
      loadFromBucket: async (path, bucketName) => {
        try {
            path = getRelativePath(path);
            const fullPath = `${bucketName}/${path}`;
            const url = encodeURI(`http://localhost:${process.env.STORAGE_PORT}/${fullPath}`);
            logger.debug(`loadFromBucket: Generated URL for loading from bucket: ${url}`);
    
            return url;
        } catch (error) {
            logger.error(`Error in loadFromBucket: ${error.message}`);
            throw error;
        }
      },
      deleteFile: async (filename, bucketName) => {
        try {
          filename = getRelativePath(filename);
          const fullPath = `${www}${bucketName}/${filename}`;
          await fs.promises.unlink(fullPath);
          logger.debug(`deleteFile: File deleted at ${fullPath}`);
        } catch (error) {
          logger.error(`Error in deleteFile: ${error.message}`);
          throw error;
        }
      },
      listFiles: async (bucketName, options = {}) => {
        try {
          const bucketPath = path.join(www, bucketName);
          const prefix = getRelativePath(options.prefix || '');
          const fullPath = path.join(bucketPath, prefix);

          const allFiles = await fs.promises.readdir(fullPath, { withFileTypes: true });
          const files = allFiles
            .filter(dirent => dirent.isFile())
            .map(dirent => ({
              name: path.relative(bucketPath, path.join(fullPath, dirent.name)),
            }));

          logger.debug(`listFiles: Listed ${files.length} files from ${fullPath}`);
          return files;
        } catch (error) {
          logger.error(`Error in listFiles: ${error.message}`);
          throw error;
        }
      },
      setPublic: async (path, bucketName) => {
        logger.debug(`[Emulated] Set public: ${bucketName}/${getRelativePath(path)}`);
      },
      setPrivate: async (path, bucketName) => {
        logger.debug(`[Emulated] Set private: ${bucketName}/${getRelativePath(path)}`);
      },
    };
  } else {
    const storage = new Storage();

    return {
      saveToBucket: async (filename, bucketName, content, isPublic) => {
        filename = getRelativePath(filename);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filename);
        const fileBuffer = new Buffer.from(content, "base64");

        logger.debug(`Saving file ${filename} to bucket ${bucketName}`);
        const sr = await file.save(fileBuffer);

        let link = "";
        if (isPublic) {
          logger.debug(`Setting file ${filename} to public`);
          await file.makePublic();
          link = await file.publicUrl();
        } else {
          link = await file.getSignedUrl({
            action: "read",
            expires: new Date(Date.now() + 1000 * 60 * 5),
          });
        }
        return link;
      },
      loadFromBucket: async (path, bucketName) => {
        path = getRelativePath(path);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        const isPublic = await file.isPublic();

        let link = "";
        if (isPublic[0] == true) {
          link = await file.publicUrl();
        } else {
          link = await file.getSignedUrl({
            action: "read",
            expires: new Date(Date.now() + 1000 * 60 * 5),
          });
        }
        return link;
      },
      deleteFile: async (filename, bucketName) => {
        try {
          filename = getRelativePath(filename);
          const bucket = storage.bucket(bucketName);
          const file = bucket.file(filename);
          await file.delete();
          logger.debug(`Deleted file ${filename} from bucket ${bucketName}`);
        } catch (error) {
          logger.error(`Error in deleteFile: ${error.message}`);
          throw error;
        }
      },
      listFiles: async (bucketName, options = {}) => {
        try {
          if (options.prefix) {
            options.prefix = getRelativePath(options.prefix);
          }
          const bucket = storage.bucket(bucketName);
          const [files] = await bucket.getFiles(options);
          logger.debug(`Listed ${files.length} files from bucket ${bucketName}`);
          return files.map(file => ({ name: file.name }));
        } catch (error) {
          logger.error(`Error in listFiles: ${error.message}`);
          throw error;
        }
      },
      setPublic: async (path, bucketName) => {
        path = getRelativePath(path);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        await file.makePublic();
      },
      setPrivate: async (path, bucketName) => {
        path = getRelativePath(path);
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        await file.makePrivate();
      },
    };
  }
};