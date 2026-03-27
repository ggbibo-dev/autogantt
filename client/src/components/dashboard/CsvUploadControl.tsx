import { useId } from "react";
import { Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CsvUploadControlProps {
  disabled?: boolean;
  onUpload: (file: File) => void;
}

export function CsvUploadControl({
  disabled = false,
  onUpload,
}: CsvUploadControlProps) {
  const inputId = useId();

  return (
    <div className="flex items-center justify-end">
      <input
        id={inputId}
        type="file"
        accept=".csv"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          onUpload(file);
          event.target.value = "";
        }}
      />
      <label
        htmlFor={disabled ? undefined : inputId}
        aria-disabled={disabled}
        className={cn(
          buttonVariants({ variant: "default" }),
          "cursor-pointer",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Upload />
        Upload CSV
      </label>
    </div>
  );
}
