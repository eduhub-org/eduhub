import Head from "next/head";
import { useRouter } from "next/router";
import { FC } from "react";

const CoursePage: FC = () => {
  const router = useRouter();
  const { courseId } = router.query;

  const x = 7;

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>{courseId}</h1>
      </main>
    </div>
  );
};

export default CoursePage;
