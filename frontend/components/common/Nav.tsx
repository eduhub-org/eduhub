import { useRouter } from "next/router";
import { ChangeEvent, FC, useCallback, useState } from "react";

export interface TabList {
    id: string,
    tabTitle: string,
    isSelected: boolean
}

interface IProps {
    tabs: TabList[],
    onTabClick: (tab: TabList) => any
}

const Nav: FC<IProps> = ({ tabs, onTabClick }) => {

    const router = useRouter();

    let { session } = router.query;
    session = session ?? tabs[0].id;

    const tabStyle = (tab: TabList) => {
        return session == tab.id ? 'py-2 px-8 bg-indigo-100 text-indigo-700 rounded-full' : 'py-2 px-8 text-gray-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-full';
    }

    const handleTabClick = useCallback((tab: TabList) => {
        console.log(tab)
        tab.isSelected = !tab.isSelected;
    }, []);

    if (tabs.length == 0) {
        return <></>;
    }

    return (
        <div className="flex items-center">
            {
                tabs.map(tab => (
                    <a key={tab.id} href={`${router.route}?session=${tab.id}`} className="rounded-full focus:outline-none focus:ring-2  focus:bg-indigo-50 focus:ring-indigo-800 mr-2">
                        <div className={tabStyle(tab)}>
                            <p>{tab.tabTitle}</p>
                        </div>
                    </a>
                ))
            }
        </div>
    )
}

export default Nav;