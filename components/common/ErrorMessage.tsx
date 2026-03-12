import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200" role="alert">
      <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
      <span className="sr-only">Error</span>
      <div>
        <span className="font-medium">Error:</span> {message}
      </div>
    </div>
  );
};
