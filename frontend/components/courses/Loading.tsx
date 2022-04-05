const Loading = () => {
  return (
    <>
      <div className="flex w-full flex-col items-center">
        <div className="mt-12 w-5/6 animate-pulse flex-row items-center justify-center space-x-1 border p-2">
          <div className="flex flex-col space-y-2">
            <div className="h-6 w-11/12 rounded-md bg-gray-300 " />
            <div className="h-6 w-10/12 rounded-md bg-gray-300 " />
            <div className="h-6 w-9/12 rounded-md bg-gray-300 " />
            <div className="h-6 w-9/12 rounded-md bg-gray-300 " />
          </div>
        </div>
      </div>
    </>
  );
};
export default Loading;
