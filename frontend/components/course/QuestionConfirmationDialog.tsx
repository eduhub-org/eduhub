import { Dialog, DialogTitle } from "@material-ui/core";
import { FC } from "react";
import { Button } from "../common/Button";
import { MdClose } from "react-icons/md";

interface QuestionProps {
    question: string,
    confirmationText: string,
    onClose: (confirmed: boolean) => void,
    open: boolean
}

export const QuestionConfirmationDialog: FC<QuestionProps> = ({
    question,
    confirmationText,
    onClose,
    open
}) => {
    return (<Dialog open={open} onClose={() => {onClose(false)}}>
        <DialogTitle>
            <div className="grid grid-cols-2">
                <div>
                    Bestätigung
                </div>
                <div className="cursor-pointer flex justify-end">
                    <MdClose onClick={() => {onClose(false)}} />
                </div>
            </div>
            
        </DialogTitle>

        <div className="m-16">
            <div className="mb-8">
                {
                    question
                }
            </div>

            <div className="grid grid-cols-2">
                <div>
                    <Button  onClick={() => {onClose(false)}}>Abbrechen</Button>
                </div>
                <div className="flex justify-end">
                    <Button filled onClick={() => {onClose(true)}}>{confirmationText}</Button>
                </div>
                
            </div>
        </div>

        

    </Dialog>)
}