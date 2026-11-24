import { createCourseRoute } from '../../components/pages/CourseContent/courseRoute';

const { getServerSideProps, Page } = createCourseRoute('course');

export { getServerSideProps };
export default Page;
