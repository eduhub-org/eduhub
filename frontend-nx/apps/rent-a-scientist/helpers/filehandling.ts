import Papa from 'papaparse';

export const parseCsvFileUploadEvent = async (
  event: any
): Promise<any[] | null> => {
  if (event.target.files == null || event.target.files.length === 0) {
    console.log('empty upload event!', event);
    return null;
  } else {
    const file = event.target.files[0];
    const fileLoadPromise = new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        if (e.target && e.target.result) {
          resolve(e.target.result);
        } else {
          console.log('FileReader is missing a file', e);
          resolve(null);
        }
      };

      reader.onabort = (e: any) => {
        console.log('FileReader.onabort: ', e);
        resolve(null);
      };

      reader.onerror = (e: any) => {
        console.log('FileReader.onerror: ', e);
        if (e.currentTarget && e.currentTarget.error) {
          reject(e.currentTarget.error);
        } else {
          reject(new Error('unknown error'));
        }
      };

      reader.readAsText(file);
    });

    try {
      const fileTxt = await fileLoadPromise;

      if (fileTxt != null) {
        const parsed = Papa.parse(fileTxt, {
          header: true,
          transformHeader: (h) => h.trim(),
        });

        return parsed.data;
      } else {
        return null;
      }
    } finally {
      if (event.nativeEvent.srcElement && event.nativeEvent.srcElement.value) {
        event.nativeEvent.srcElement.value = null;
      }
    }
  }
};
