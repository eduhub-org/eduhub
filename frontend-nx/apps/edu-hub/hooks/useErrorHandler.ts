    import { useState } from 'react';

    const useErrorHandler = (initialState = '') => {
      const [error, setError] = useState(initialState);

      const handleError = (error: string) => {
        setError(error);
      };

      const resetError = () => {
        setError('');
      };

      return { error, handleError, resetError };
    };

    export default useErrorHandler;
    