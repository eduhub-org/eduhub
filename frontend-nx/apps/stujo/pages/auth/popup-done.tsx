import { useEffect } from 'react';

/**
 * Landing page of the popup login flow: tells the opener the session is
 * ready and closes itself. next-auth also broadcasts the new session
 * across tabs, so the opener updates even if the message is missed.
 */
const PopupDone = () => {
  useEffect(() => {
    try {
      window.opener?.postMessage('stujo:auth-complete', window.location.origin);
    } catch {
      // opener gone — nothing to notify
    }
    window.close();
  }, []);

  return (
    <p style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      Anmeldung abgeschlossen – dieses Fenster kann geschlossen werden.
    </p>
  );
};

export default PopupDone;
