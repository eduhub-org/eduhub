import { IconButton } from "@material-ui/core"
import { FC } from "react"
import { IoMdAddCircle } from "react-icons/io"

export interface TagElement {
    id: number,
    display: string
}

interface IProps {
    tags: TagElement[]
    requestAddTag: () => void
    requestDeleteTag: (id: number) => void
}

const EhTagEdit: FC<IProps> = ({
    tags
}) => {
    return <div className="grid grid-cols-12" >

        <div className="col-span-10">
            {tags.map(tag => <div title={tag.display} className="grid grid-cols-12 rounded-full bg-edu-tag-color mb-2 last:mb-0" key={tag.id}>
                <div className="mr-2 ml-2 col-span-10 truncate">{tag.display}</div>
                <div className="col-span-2 text-white cursor-pointer text-center">x</div>
            </div>)}
        </div>
        <div className="col-span-2">
            <IconButton className="focus:outline-none" size="small" onClick={() => { }}>
                <IoMdAddCircle />
            </IconButton>
        </div>
    </div>
}

export default EhTagEdit;