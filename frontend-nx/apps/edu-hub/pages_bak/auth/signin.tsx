import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

import Loading from '../../components/common/Loading';

const SignIn: React.FC = () => {
  const router = useRouter();
  const { provider, callbackUrl } = router.query;

  useEffect(() => {
    if (typeof provider === 'string' && typeof callbackUrl === 'string') {
      signIn(provider, { callbackUrl });
    }
  }, [provider, callbackUrl]);
  return (
    <div className="flex justify-center items-center h-[100vh] w-[100vw]">
      <Loading />
    </div>
  );
};

export default SignIn;
