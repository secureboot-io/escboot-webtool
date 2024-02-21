import { Button, Card, CardBody, CardFooter, CardHeader, Chip, Snippet } from "@nextui-org/react";
import React, { FC, useRef } from "react";

interface FileUploadProps {
    onFileSelected?: (file: File) => void;
}

const FileUpload: FC<FileUploadProps> = ({
    onFileSelected,
    ...otherProps
}) => {
        const fileInputField = useRef<HTMLInputElement>(null);
        const [file, setFile] = React.useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if(files && files.length > 0) {
            console.log(files[0]);
            setFile(files[0]);
            onFileSelected?.(files[0]);
        }
    };

        const handleBrowse = () => {
                fileInputField.current?.click();
        };

  return (
    <Card>
        <CardHeader className="text-small">Private key file</CardHeader>
        <CardFooter className="gap-4 justify-between">
        
        <Chip radius="sm" variant="flat">{file?.name}</Chip>
            <Button onClick={handleBrowse} variant="bordered" color="success">Browse</Button>
            <input
            style={{ display: "none" }}
            name="file"
            type="file"
            ref={fileInputField}
            title=""
            value=""
            onChange={handleFileChange}
            {...otherProps}
            />
        </CardFooter>
      </Card>      
  );
}


export default FileUpload;