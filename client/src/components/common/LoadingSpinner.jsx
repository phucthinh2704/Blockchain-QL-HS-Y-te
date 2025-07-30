import { memo } from "react";

const LoadingSpinner = () => (
   <div className="flex flex-col gap-4 items-center justify-center min-h-full min-w-full bg-white/20">
      <div className="animate-spin rounded-full h-18 w-18 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
   </div>
);
export default memo(LoadingSpinner);
