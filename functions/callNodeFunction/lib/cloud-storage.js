import fs from "fs";
import logger from "../index.js";

// At first I tried to emulate the google cloud storage backend using an inofficial emulator: https://github.com/oittaa/gcp-storage-emulator
// However that did not work out due to various errors the emulator produced
// Thus instead the serverless functions have two modes:

// emulated storage is for local development, it simply stores all the files inside the container and serves them as express static files

// non emulated storage is still available during production, this helper function is used to hide this decision from the serverless functions

// Storage should be from require("@google-cloud/storage")
// since this file is outside of the directory of the function it does not work to import it here
// in the future it might be worth to setup a better mechanism to share code between functions
// nx might be a good choice here, basically a monorepository for the functions with custom build process
// to produce whatever output is needed in production
export const buildCloudStorage = (Storage) => {
  const emulated = process.env.ENVIRONMENT == "development";

  if (emulated) {
    const www = "/home/node/www/";
    return {
      saveToBucket: async (filename, bucketName, content, isPublic) => {
        try {
 
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
            const fullPath = `${bucketName}/${path}`;
            const url = encodeURI(`http://localhost:${process.env.STORAGE_PORT}/${fullPath}`);
            logger.debug(`loadFromBucket: Generated URL for loading from bucket: ${url}`);
    
            return url;
        } catch (error) {
            logger.error(`Error in loadFromBucket: ${error.message}`);
            throw error;
        }
    },
        
      setPublic: async (path, bucketName) => {
        logger.debug(`[Emulated] Set public: ${bucketName}/${path}`);
      },
      setPrivate: async (path, bucketName) => {
        logger.debug(`[Emulated] Set private: ${bucketName}/${path}`);
      },
    };
  } else {
    const storage = new Storage();

    return {
      saveToBucket: async (filename, bucketName, content, isPublic) => {
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
      setPublic: async (path, bucketName) => {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        await file.makePublic();
      },
      setPrivate: async (path, bucketName) => {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(path);
        await file.makePrivate();
      },
    };
  }
};
