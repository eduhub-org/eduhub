import { createCourseRoute } from '../../components/pages/CourseContent/courseRoute';

const { getServerSideProps, Page } = createCourseRoute('degree');

export { getServerSideProps };
export default Page;
