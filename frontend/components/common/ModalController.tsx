import React, { FC, useCallback } from "react";

interface IPros {
  showModal: boolean;
  modalTitle?: string;
  onClose: (showModel: boolean) => void;
}

const ModalControl: FC<IPros> = ({
  showModal,
  onClose,
  modalTitle,
  children,
}) => {
  const onCloseHandler = useCallback(() => {
    onClose(!showModal);
  }, [showModal, onClose]);

  return (
    <>
      {showModal ? (
        <>
          <div
            className="bg-emerald-500 
                    active:bg-emerald-600 
                    items-center 
                    flex 
                    text-gray-300
                    overflow-x-hidden overflow-y-auto 
                    fixed 
                    inset-0 
                    z-50"
          >
            <div className="m-6 mx-auto bg-edu-modal-bg-color p-5">
              <div className="">
                {/* header */}
                <div className="flex items-start pb-10">
                  <button className="" onClick={onCloseHandler}>
                    <span className="font-bold h-30 w-30 text-2xl block ">
                      X
                    </span>
                  </button>
                </div>
                {modalTitle && (
                  <div className="flex items-start pb-10">
                    <h3 className="font-semibold ">{modalTitle || ""}</h3>
                  </div>
                )}
              </div>
              <div>{children}</div>
            </div>
          </div>
          <div className="opacity-50 fixed inset-0 z-40 bg-black" />
        </>
      ) : null}
    </>
  );
};

export default ModalControl;
