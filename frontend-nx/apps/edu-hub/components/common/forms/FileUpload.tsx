import React from 'react';
import { useForm } from 'react-hook-form';
import PublishIcon from '@material-ui/icons/Publish';

import { useFileUploader } from '../../../hooks/fileUpload';

const FileUpload = ({ id, uploadMutation, submitMutation, uploadVariables, submitVariables, refetchQueries }) => {
  const { register } = useForm();
  const { getFileBase64, isLoading } = useFileUploader();

  const handleFileUploadAndSubmit = async (file) => {
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
      fileUrl = resultData[key].path;
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

  const onFileChange = async (event) => {
    const file = event.target.files[0];
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
          <PublishIcon />
        </label>
      </div>
    </form>
  );
};

export default FileUpload;
