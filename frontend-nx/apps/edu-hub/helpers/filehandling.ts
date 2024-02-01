import log from 'loglevel';

export const getPublicUrl = (filePath: string): string | null  => {
  log.debug(`getPublicUrl called with filePath: ${filePath}`);

  // check if filePath is null
  if (!filePath) {
    log.debug('filePath is null, returning null.');
    return null;
  }
  
  const isPublicLegacy =
    filePath.startsWith("https://") || filePath.startsWith("http://");
  const isPublic = filePath.includes("/public/");

  log.debug(`isPublicLegacy: ${isPublicLegacy}, isPublic: ${isPublic}`);

  if (isPublicLegacy) {
    log.debug(`Returning legacy public URL: ${filePath}`);
    return filePath;
  } else if (isPublic) {
    const serverAddress = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
    const publicUrl = `${serverAddress}/${filePath}`;
    log.debug(`Returning constructed public URL: ${publicUrl}`);
    return publicUrl;
  } else {
    log.debug('File is not public, returning null.');
    return null;
  }
}

export const getPublicImageUrl = (filePath: string, size: number): string | null  => {
  log.debug(`getPublicImageUrl called with filePath: ${filePath} and size: ${size}`);

  // Check if filePath is null
  if (!filePath) {
    log.debug('filePath is null, returning null.');
    return null;
  }

  // Modify the original image path to point to the resized image path
  const resizedFilePath = filePath.replace(/\.[^.]+$/, `-${size}.webp`); // Change extension to .webp
  log.debug(`Resized file path: ${resizedFilePath}`);

  // Use getPublicUrl to construct the full URL for the resized image
  const publicUrl = getPublicUrl(resizedFilePath);
  log.debug(`Public URL for resized image: ${publicUrl}`);
  return publicUrl;
}

export const bytesToBase64 = (bytes: Uint8Array) => {
  /* eslint-disable no-bitwise */
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a, b, c, d;
  let chunk;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
};

export interface UploadFile {
  name: string;
  data: string;
}

export const parseFileUploadEvent = async (
  event: any
): Promise<UploadFile | null> => {
  if (event.target.files == null || event.target.files.length === 0) {
    console.log("empty upload event!", event);
    return null;
  } else {
    const file = event.target.files[0];
    const name = file.name || "unknown.file";
    const fileLoadPromise = new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        if (e.target && e.target.result) {
          const data = new Uint8Array(e.target.result);
          resolve(bytesToBase64(data));
        } else {
          console.log("FileReader is missing a file", e);
          resolve(null);
        }
      };

      reader.onabort = (e: any) => {
        console.log("FileReader.onabort: ", e);
        resolve(null);
      };

      reader.onerror = (e: any) => {
        console.log("FileReader.onerror: ", e);
        if (e.currentTarget && e.currentTarget.error) {
          reject(e.currentTarget.error);
        } else {
          reject(new Error("unknown error"));
        }
      };

      reader.readAsArrayBuffer(file);
    });

    try {
      const fileBase64 = await fileLoadPromise;

      if (fileBase64 != null) {
        return {
          name,
          data: fileBase64,
        };
      } else {
        return null;
      }
    } finally {
      if (event.srcElement && event.srcElement.value) {
        event.srcElement.value = null;
      }
    }
  }
};
