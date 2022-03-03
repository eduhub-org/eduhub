import { FC } from "react";
import { CourseList_Course } from "../../queries/__generated__/CourseList";

interface IProps {
    course: CourseList_Course;
}
const CourseOneRow: FC<IProps> = ({ course }) => {

    return (
        <>
            <tr className="bg-edu-course-list pt-5">
                <td>
                    <div className="ml-5">
                        <div className="bg-gray-200 rounded-sm w-5 h-5 flex flex-shrink-0 justify-center items-center relative">
                            <input placeholder="checkbox" type="checkbox" className="focus:opacity-100 checkbox opacity-0 absolute cursor-pointer w-full h-full" />
                        </div>
                    </div>
                </td>
                <td>
                    <div className="flex items-center justify-start ml-5 max-w-xs break-words">
                        <p className="text-gray-700 break-words">{course.title}</p>
                    </div>
                </td>
                <td className="ml-5">
                    <div className="flex items-start">
                        <p className="text-sm leading-none text-gray-600 ml-5">Vorname Name</p>
                    </div>
                </td>
                <td >
                    <div>
                        <p className="text-sm leading-none text-gray-600 ml-5">{course.ects}</p>
                    </div>
                </td>
                <td >
                    <div >
                        <p className="text-sm leading-none text-gray-600 ml-5">15 / 11 / 6</p>
                    </div>
                </td>
                <td>
                    <div className="flex items-center">
                        <p className="text-sm leading-none text-gray-600 ml-5">SS2020</p>
                    </div>
                </td>
                <td >
                    <div className="flex items-center mt-2 mb-2">
                        <p className="text-sm leading-none text-gray-600 ml-5">20%</p>
                        <div className="flex px-5 items-center">
                            <button className="focus:ring-2 rounded-md focus:outline-none" role="button" aria-label="option">
                                <svg className="dropbtn" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4.16667 10.8332C4.62691 10.8332 5 10.4601 5 9.99984C5 9.5396 4.62691 9.1665 4.16667 9.1665C3.70643 9.1665 3.33334 9.5396 3.33334 9.99984C3.33334 10.4601 3.70643 10.8332 4.16667 10.8332Z" stroke="#9CA3AF" stroke-width="1.25" strokeLinecap="round" strokeLinejoin="round"></path>
                                    <path d="M10 10.8332C10.4602 10.8332 10.8333 10.4601 10.8333 9.99984C10.8333 9.5396 10.4602 9.1665 10 9.1665C9.53976 9.1665 9.16666 9.5396 9.16666 9.99984C9.16666 10.4601 9.53976 10.8332 10 10.8332Z" stroke="#9CA3AF" stroke-width="1.25" strokeLinecap="round" strokeLinejoin="round"></path>
                                    <path d="M15.8333 10.8332C16.2936 10.8332 16.6667 10.4601 16.6667 9.99984C16.6667 9.5396 16.2936 9.1665 15.8333 9.1665C15.3731 9.1665 15 9.5396 15 9.99984C15 10.4601 15.3731 10.8332 15.8333 10.8332Z" stroke="#9CA3AF" stroke-width="1.25" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                </td>
            </tr>
            <tr className="h-1 bg-white"></tr>
        </>
    )

}

export default CourseOneRow;