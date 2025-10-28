import { createContext, useContext, FC, ReactNode, useState, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { ErrorMessageDialog } from '../components/common/dialogs/ErrorMessageDialog';

interface AuthErrorContextType {
  showAuthError: (message: string, shouldSignOut?: boolean) => void;
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(undefined);

export const useAuthError = () => {
  const context = useContext(AuthErrorContext);
  if (!context) {
    // Fallback: if context is not available (e.g., during SSR or before provider is mounted),
    // return a no-op function to prevent breaking the app
    console.warn('useAuthError called outside of AuthErrorProvider, using fallback');
    return {
      showAuthError: (message: string, shouldSignOut?: boolean) => {
        console.error('Auth error (fallback):', message);
        if (shouldSignOut) {
          signOut();
        } else {
          alert(message); // Fallback to alert if context not available
        }
      },
    };
  }
  return context;
};

interface AuthErrorProviderProps {
  children: ReactNode;
}

export const AuthErrorProvider: FC<AuthErrorProviderProps> = ({ children }) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [shouldSignOut, setShouldSignOut] = useState(false);
  
  // Use a ref to track if an error dialog is already shown
  // This prevents multiple simultaneous errors from showing multiple dialogs
  const errorShownRef = useRef(false);

  const showAuthError = useCallback((message: string, signOutAfterClose = false) => {
    // If an error is already being displayed, ignore subsequent errors
    if (errorShownRef.current) {
      console.log('Auth error already displayed, ignoring:', message);
      return;
    }

    console.error('Auth error:', message);
    errorShownRef.current = true;
    setErrorMessage(message);
    setErrorOpen(true);
    setShouldSignOut(signOutAfterClose);
  }, []);

  const handleClose = useCallback(() => {
    setErrorOpen(false);
    errorShownRef.current = false;
    
    if (shouldSignOut) {
      // Sign out after a short delay to allow the dialog to close smoothly
      setTimeout(() => {
        signOut();
      }, 300);
    }
  }, [shouldSignOut]);

  return (
    <AuthErrorContext.Provider value={{ showAuthError }}>
      {children}
      <ErrorMessageDialog
        errorMessage={errorMessage}
        open={errorOpen}
        onClose={handleClose}
      />
    </AuthErrorContext.Provider>
  );
};

