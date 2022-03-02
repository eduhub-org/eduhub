import { FC, useEffect, useState } from "react"
import Head from "next/head";
import { Page } from "../components/Page";
import { OnlyAdmin, OnlyNotAdmin } from "../components/common/OnlyLoggedIn";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageBlock } from "../components/common/PageBlock";
import Image from "next/image";
import plusImg from "../public/images/common/plus-symbol.svg"
import { useAdminQuery, useAuthedQuery } from "../hooks/authedQuery";
import { ProgramList, ProgramList_Program } from "../queries/__generated__/ProgramList";
import { PROGRAM_LIST } from "../queries/programList";
import { MdAddCircle, MdCheckBox, MdCheckBoxOutlineBlank, MdDelete } from "react-icons/md";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useAdminMutation, useAuthedMutation } from "../hooks/authedMutation";
import { UpdateProgramVisibility, UpdateProgramVisibilityVariables } from "../queries/__generated__/UpdateProgramVisibility";
import { DELETE_PROGRAM, INSERT_PROGRAM, UPDATE_PROGRAM_APPLICATION_END, UPDATE_PROGRAM_APPLICATION_START, UPDATE_PROGRAM_LECTURE_END, UPDATE_PROGRAM_LECTURE_START, UPDATE_PROGRAM_SHORT_TITLE, UPDATE_PROGRAM_TITLE, UPDATE_PROGRAM_UPLOAD_DEADLINE, UPDATE_PROGRAM_VISIBILITY } from "../queries/updateProgram";
import { QuestionConfirmationDialog } from "../components/course/QuestionConfirmationDialog";
import { DebounceInput } from "react-debounce-input";
import { UpdateProgramTitle, UpdateProgramTitleVariables } from "../queries/__generated__/UpdateProgramTitle";
import { UpdateProgramShortTitle, UpdateProgramShortTitleVariables } from "../queries/__generated__/UpdateProgramShortTitle";
import { UpdateProgramApplicationStart, UpdateProgramApplicationStartVariables } from "../queries/__generated__/UpdateProgramApplicationStart";
import { UpdateProgramApplicationEnd, UpdateProgramApplicationEndVariables } from "../queries/__generated__/UpdateProgramApplicationEnd";
import { UpdateProgramLectureStart, UpdateProgramLectureStartVariables } from "../queries/__generated__/UpdateProgramLectureStart";
import { UpdateProgramLectureEnd, UpdateProgramLectureEndVariables } from "../queries/__generated__/UpdateProgramLectureEnd";
import { UpdateProgramUploadDeadline, UpdateProgramUploadDeadlineVariables } from "../queries/__generated__/UpdateProgramUploadDeadline";
import { Button, IconButton } from "@material-ui/core";
import { InsertProgram, InsertProgramVariables } from "../queries/__generated__/InsertProgram";
import { DeleteProgram, DeleteProgramVariables } from "../queries/__generated__/DeleteProgram";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
    props: {
        ...(await serverSideTranslations(locale, [
            "common",
        ])),
    },
});

const ProgramsPage: FC = () => {

    const qResult = useAdminQuery<ProgramList>(PROGRAM_LIST);

    if (qResult.error) {
        console.log("query programs error", qResult.error);
    }

    const ps = [...qResult.data?.Program || []];
    ps.sort((a, b) => b.lectureStart.getTime() - a.lectureStart.getTime());
    const programs = ps;

    const [openProgram, setOpenProgram] = useState(-1);


    const [insertProgram, ] = useAdminMutation<InsertProgram, InsertProgramVariables>(INSERT_PROGRAM);
    const insertDefaultProgram = async () => {
        const today = new Date();
        today.setMilliseconds(0);
        today.setSeconds(0);
        today.setMinutes(0);
        today.setHours(0);
        await insertProgram({
            variables: {
                title: "Programmtitel festlegen",
                today: new Date()
            }
        });

        qResult.refetch();
    };

    const [deleteProgramMutation, ] = useAdminMutation<DeleteProgram, DeleteProgramVariables>(DELETE_PROGRAM);
    const deleteProgram = async (pid: number) => {
        await deleteProgramMutation({
            variables: {
                programId: pid
            }
        });
        qResult.refetch();
    }

    const [updateVisibility, ] = useAdminMutation<UpdateProgramVisibility, UpdateProgramVisibilityVariables>(UPDATE_PROGRAM_VISIBILITY);
    const setProgramVisibility = async (pid: number, isVisible: boolean) => {
        await updateVisibility({
            variables: {
                programId: pid,
                visible: isVisible
            }
        });
        qResult.refetch();
    }

    const [updateTitle, ] = useAdminMutation<UpdateProgramTitle, UpdateProgramTitleVariables>(UPDATE_PROGRAM_TITLE);
    const setProgramTitle = async (pid: number, title: string) => {
        await updateTitle({
            variables: {
                programId: pid,
                title
            }
        });
        qResult.refetch();
    }

    const [updateShortTitle, ] = useAdminMutation<UpdateProgramShortTitle, UpdateProgramShortTitleVariables>(UPDATE_PROGRAM_SHORT_TITLE);
    const setProgramShortTitle = async (pid: number, shortTitle: string) => {
        await updateShortTitle({
            variables: {
                programId: pid,
                shortTitle
            }
        })
        qResult.refetch();
    }

    const sanitizeDate = (d: Date) => {
        return d;
    }

    const [updateApplicationStart, ] = useAdminMutation<UpdateProgramApplicationStart, UpdateProgramApplicationStartVariables>(UPDATE_PROGRAM_APPLICATION_START);
    const setApplicationStart = async (pid: number, applicationStart: Date | null) => {
        if (applicationStart != null) {

            await updateApplicationStart({
                variables: {
                    programId: pid,
                    applicationStart: sanitizeDate(applicationStart)
                }
            })

            qResult.refetch();
        }
    }

    const [updateApplicationEnd, ] = useAdminMutation<UpdateProgramApplicationEnd, UpdateProgramApplicationEndVariables>(UPDATE_PROGRAM_APPLICATION_END);
    const setApplicationEnd = async (pid: number, applicationEnd: Date | null) => {
        if (applicationEnd != null) {
            await updateApplicationEnd({
                variables: {
                    programId: pid,
                    applicationEnd: sanitizeDate(applicationEnd)
                }
            });

            qResult.refetch();
        }
    }

    const [updateLectureStart, ] = useAdminMutation<UpdateProgramLectureStart, UpdateProgramLectureStartVariables>(UPDATE_PROGRAM_LECTURE_START);
    const setLectureStart = async (pid: number, lectureStart: Date | null) => {
        if (lectureStart != null) {
            await updateLectureStart({
                variables: {
                    programId: pid,
                    lectureStart: sanitizeDate(lectureStart)
                }
            });
            qResult.refetch();
        }
    };

    const [updateLectureEnd, ] = useAdminMutation<UpdateProgramLectureEnd, UpdateProgramLectureEndVariables>(UPDATE_PROGRAM_LECTURE_END);
    const setLectureEnd = async (pid: number, lectureEnd: Date | null) => {
        if (lectureEnd != null) {
            await updateLectureEnd({
                variables: {
                    programId: pid,
                    lectureEnd: sanitizeDate(lectureEnd)
                }
            });
            qResult.refetch();
        }
    }

    const [updateUploadDeadline, ] = useAdminMutation<UpdateProgramUploadDeadline, UpdateProgramUploadDeadlineVariables>(UPDATE_PROGRAM_UPLOAD_DEADLINE);
    const setUploadDeadline = async (pid: number, deadline: Date | null) => {
        if (deadline != null) {
            await updateUploadDeadline({
                variables: {
                    programId: pid,
                    deadline: sanitizeDate(deadline)
                }
            });
            qResult.refetch();
        }
    }



    const [activeDialogProgram, setActiveDialogProgram] = useState<ProgramList_Program | null>(null);



    const [confirmMakeVisibleOpen, setConfirmMakeVisibleOpen] = useState(false);
    const handleMakeVisibleDialogClose = (pid: number, confirm: boolean) => {
        if (confirm) {
            setProgramVisibility(pid, true);
        }
        setConfirmMakeVisibleOpen(false);
    }

    const [confirmMakeInvisibleOpen, setConfirmMakeInvisibleOpen] = useState(false);
    const handleMakeInvisibleDialogClose = (pid: number, confirm: boolean) => {
        if (confirm) {
            setProgramVisibility(pid, false);
        }
        setConfirmMakeInvisibleOpen(false);
    }

    const [confirmDeleteProgramOpen, setConfirmDeleteProgramOpen] = useState(false);
    const handleConfirmDeleteProgramClose = (pid: number, confirm: boolean) => {
        if (confirm) {
            deleteProgram(pid);
        }
        setConfirmDeleteProgramOpen(false);
    }


    return (
        <>
            <Head>
                <title>opencampus.sh Edu Hub</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Page>
                <OnlyAdmin>
                    <PageBlock>
                    <div className="flex flex-row mb-12">
                        <h1 className="text-4xl font-bold">Programme</h1>
                    </div>
                    <div className="flex justify-end mb-12">
                        <Button onClick={() => insertDefaultProgram()} startIcon={<MdAddCircle />}>Programm hinzufügen</Button>
                    </div>
                    <div className="grid grid-cols-10">
                        <div>Veröff.</div>
                        <div className="col-span-2">Programmtitel</div>
                        <div>Kurztitel</div>
                        <div>Bew. Start</div>
                        <div>Bew. Ende</div>
                        <div>Start</div>
                        <div>Ende</div>
                        <div>Abgabe Frist</div>
                        <div>&nbsp;</div>
                    </div>  
                    {programs != null && programs.length > 0 && programs.map((v, i) => (
                        <>
                            <div key={`${v.id}`} className="grid grid-cols-10 mb-1 bg-gray-100">
                                <div className="flex justify-center cursor-pointer" onClick={() => {
                                    setActiveDialogProgram(v);
                                    if (v.visibility) {
                                        setConfirmMakeInvisibleOpen(true);
                                    } else {
                                        setConfirmMakeVisibleOpen(true);
                                    }
                                }}>
                                    {
                                        !v.visibility && <MdCheckBoxOutlineBlank size="1.5em" />
                                    }
                                    {
                                        v.visibility && <MdCheckBox size="1.5em"/>
                                    }
                                </div>
                                <div className="col-span-2">
                                    <DebounceInput
                                        className="w-full bg-gray-100"
                                        debounceTimeout={1000}
                                        value={v.title}
                                        onChange={event => setProgramTitle(v.id, event.target.value)}
                                    />
                                </div>
                                <div>
                                    <DebounceInput 
                                    className="w-full bg-gray-100"
                                    debounceTimeout={1000}
                                    value={v.shortTitle ?? ""}
                                    onChange={event => setProgramShortTitle(v.id, event?.target.value)}
                                    />
                                </div>
                                <div>
                                    <DatePicker 
                                    className="w-full bg-gray-100"
                                    dateFormat={"dd/MM/yyyy"} 
                                    selected={v.applicationStart || new Date()}
                                    onChange={event => setApplicationStart(v.id, event)} 
                                    /></div>
                                <div><DatePicker dateFormat={"dd/MM/yyyy"} 
                                    className="w-full bg-gray-100"
                                    selected={v.defaultApplicationEnd || new Date()} 
                                    onChange={event => setApplicationEnd(v.id, event)} 
                                    /></div>
                                <div><DatePicker 
                                    dateFormat={"dd/MM/yyyy"} 
                                    className="w-full bg-gray-100"
                                    selected={v.lectureStart || new Date()} 
                                    onChange={event => setLectureStart(v.id, event)} /></div>
                                <div><DatePicker 
                                    dateFormat={"dd/MM/yyyy"} 
                                    className="w-full bg-gray-100"
                                    selected={v.lectureEnd || new Date()} 
                                    onChange={event => setLectureEnd(v.id, event)}  /></div>
                                <div>
                                    <DatePicker 
                                    dateFormat={"dd/MM/yyyy"}
                                    className="w-full bg-gray-100"
                                    selected={v.projectRecordUploadDeadline || new Date()}
                                    onChange={event => setUploadDeadline(v.id, event)}
                                    /></div>

                                <div className="grid grid-cols-2" >
                                    <div>
                                        <IconButton onClick={() => setOpenProgram(openProgram !== v.id ? v.id : -1)}>
                                            {openProgram !== v.id ? <IoIosArrowDown  size="0.75em" /> : <IoIosArrowUp size="0.75em" />}
                                        </IconButton>
                                    </div>

                                    <div>
                                        <IconButton>
                                            <MdDelete onClick={() => {
                                                    setActiveDialogProgram(v);
                                                    setConfirmDeleteProgramOpen(true);
                                                }} size="0.75em" />
                                        </IconButton>
                                    </div>
                                </div>
                            </div>
                            {
                                openProgram === v.id && <div key={`${v.id}-edit`}>TEST</div>
                            }
                        </>
                    ))}
                    <div className="flex justify-end mt-12 mb-12">
                        <Button onClick={() => insertDefaultProgram()} startIcon={<MdAddCircle />}>Programm hinzufügen</Button>
                    </div>
                    </PageBlock>
                    <QuestionConfirmationDialog 
                        question={`Möchtest du das Programm "${activeDialogProgram?.title}" wirklich veröffentlichen?`} 
                        confirmationText={"Veröffentlichen"} 
                        onClose={confirmed => {handleMakeVisibleDialogClose(activeDialogProgram?.id || 0, confirmed)}} 
                        open={confirmMakeVisibleOpen}
                        />
                    <QuestionConfirmationDialog 
                        question={`Möchtest du die Veröffentlichung des Programmes "${activeDialogProgram?.title}" wirklich zurücknehmen?`}
                        confirmationText={"Zurücknehmen"}
                        onClose={confirmed => {handleMakeInvisibleDialogClose(activeDialogProgram?.id || 0, confirmed)}}
                        open={confirmMakeInvisibleOpen}
                        />
                    <QuestionConfirmationDialog
                    question={`Möchtest du das Programm "${activeDialogProgram?.title}" wirklich löschen?`}
                    confirmationText={"Löschen"}
                    // TODO continue: This should only be allowed if there are no more courses in the program?!
                    // or set the right cascades properties in the database?
                    onClose={confirmed => {handleConfirmDeleteProgramClose(activeDialogProgram?.id || 0, confirmed)}}
                    open={confirmDeleteProgramOpen}
                    />
                </OnlyAdmin>
                <OnlyNotAdmin>
                    <Link href="/">
                        <Button>Go back</Button>
                    </Link>
                </OnlyNotAdmin>

            </Page>
        </>)
}

export default ProgramsPage;