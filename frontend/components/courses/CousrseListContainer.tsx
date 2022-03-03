import { FC } from "react";
import { CourseList_Course } from "../../queries/__generated__/CourseList";
import Searchbar from "../common/Searchbar";
import CourseOneRow from "./CourseOneRow";

interface IProps {
    courses: CourseList_Course[];
}

const tableHeaders: string[] = [
    "Off.",
    "Title",
    "Kursleitung",
    "Bewerb",
    "eingeladen/ Bestätigt/ unbewertet",
    "Program",
    "Status"

]

const semesters: string[] = [
    "SOSE21",
    "WINSE21",
    "SOSE20",
    "WINSE20",
    "All"
]

const CourseListContainer: FC<IProps> = ({ courses }) => {

    const thStyle = "";
    const thTextStyle = "flex justify-start ml-5 text-base font-medium leading-none text-gray-700 uppercase"
    const trColorNormal = "bg"
    const selectedTab = semesters[0];
    const tabStyle = (semester: string) => {
        return semester == selectedTab ? 'py-2 px-8 bg-indigo-100 text-indigo-700 rounded-full' : 'py-2 px-8 text-gray-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-full';
    }

    return (
        <div className="sm:px-0 w-full">
            <div className="px-4 md:px-10 py-4 md:py-7">
                <div className="flex items-center justify-between">
                    <p className="focus:outline-none text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-normal text-gray-800">Kurse</p>
                </div>
            </div>
            <div className="bg-white py-4 md:py-7 px-4 md:px-8 xl:px-10">
                <div className="sm:flex items-center justify-between">
                    <div className="flex items-center">
                        {
                            semesters.map(semester => {
                                return (
                                    <a key={semester} className="rounded-full focus:outline-none focus:ring-2  focus:bg-indigo-50 focus:ring-indigo-800 mr-2">
                                        <div className={tabStyle(semester)}>
                                            <p>{semester}</p>
                                        </div>
                                    </a>
                                );
                            })
                        }
                    </div>
                    <Searchbar placeholder="Text in Title"></Searchbar>
                </div>
                <div className="bg-white py-4 flex justify-end">
                    <button className="mt-4 sm:mt-0 flex items-start justify-start px-6 py-3 bg-indigo-700 hover:bg-indigo-600 focus:outline-none rounded">
                        <p className="text-sm font-medium leading-none text-white">Add Course</p>
                    </button>
                </div>
                <div className="mt-7 overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="focus:outline-none h-16 ">
                                {
                                    tableHeaders.map(text => {
                                        return (
                                            <th key={text} className={`${thStyle}`}>
                                                <p className={thTextStyle}>{text}</p>
                                            </th>
                                        )
                                    })
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {
                                courses.map(course => <CourseOneRow key={course.id} course={course}></CourseOneRow>)
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default CourseListContainer;