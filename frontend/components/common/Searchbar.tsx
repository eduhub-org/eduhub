import { FC } from "react";
import {
    MdSearch
} from 'react-icons/md';

interface IProps {
    placeholder: string
}


const Searchbar: FC<IProps> = ({ placeholder }) => {
    return (
        <div className="">
            <div className="flex border-2 rounded">
                <button className="flex items-center justify-center px-4 border-r">
                    <MdSearch size={26}/>
                </button>
                <input type="text" className="px-4 py-2" placeholder={placeholder} />
            </div>
        </div>
    )
}

export default Searchbar;