import React from 'react';
import { useForm } from 'react-hook-form';
import { Publish } from '@mui/icons-material';
import { MutationFunction } from '@apollo/client';

import { useFileUploader } from '../../hooks/fileUpload';

interface FileUploadProps {
  id: string;
  uploadMutation: MutationFunction;
  submitMutation: MutationFunction;
  uploadVariables: Record<string, unknown>;
  submitVariables: Record<string, unknown>;
  refetchQueries?: string[];
}

const FileUpload = ({ id, uploadMutation, submitMutation, uploadVariables, submitVariables, refetchQueries = [] }: FileUploadProps) => {
  const { register } = useForm();
  const { getFileBase64, isLoading } = useFileUploader();

  const handleFileUploadAndSubmit = async (file: File) => {
    let fileUrl = null;
    if (file) {
      const base64 = await getFileBase64(file);
      // Upload the file
      const uploadResult = await uploadMutation({
        variables: {
          base64File: base64,
          fileName: file.name,
          ...uploadVariables,
        },
      });

      const resultData = uploadResult.data;
      const key = Object.keys(resultData)[0];
      const result = resultData[key];

      // Check if upload was successful
      if (!result.success) {
        console.error('File upload failed:', result.error);
        return;
      }

      fileUrl = result.filePath; // Changed from file_path to filePath
    }

    // Submit the entire form data, including the file URL
    await submitMutation({
      variables: {
        ...submitVariables,
        url: fileUrl,
      },
      refetchQueries,
    });
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUploadAndSubmit(file);
    }
  };

  return (
    <form>
      <div className="relative">
        <input
          type="file"
          {...register('file')}
          disabled={isLoading}
          onChange={onFileChange}
          className="absolute opacity-0 w-0 h-0"
          id={`fileInput-${id}`}
        />
        <label
          htmlFor={`fileInput-${id}`}
          className={`cursor-pointer p-2  flex items-center justify-center w-6 h-6 ${isLoading ? 'opacity-50' : ''}`}
        >
          <Publish />
        </label>
      </div>
    </form>
  );
};

export default FileUpload;
