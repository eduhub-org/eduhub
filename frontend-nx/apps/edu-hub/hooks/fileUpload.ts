import { useState } from 'react';

export const useFileUploader = () => {
  const [isLoading, setIsLoading] = useState(false);

  const convertToBase64 = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });



  const getFileBase64 = async (file: File): Promise<string | undefined> => {
    setIsLoading(true);
    try {
      const base64File = (await convertToBase64(file)) as string | undefined;
      return base64File;
    } catch (error) {
      console.error('Error converting file:', error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  return { getFileBase64, isLoading };
};
