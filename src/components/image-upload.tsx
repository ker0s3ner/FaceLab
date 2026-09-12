import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  description: string;
  image: string | null;
  onImageChange: (image: string | null) => void;
  icon: "front" | "side";
}

export function ImageUpload({ label, description, image, onImageChange, icon }: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => onImageChange(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [onImageChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {icon === "front" ? (
            <User className="h-4 w-4 text-primary" />
          ) : (
            <Camera className="h-4 w-4 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5"
            : image
              ? "border-transparent bg-muted/30"
              : "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <input {...getInputProps()} />

        {image ? (
          <>
            <img src={image} alt={label} className="h-full w-full rounded-xl object-cover" />
            <button
              onClick={removeImage}
              aria-label={`Remove ${label} photo`}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-background transition-colors hover:bg-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
