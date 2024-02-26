import { Button, Card, CardBody, CardFooter, CardHeader, Chip, Snippet } from "@nextui-org/react";
import React, { FC, useRef } from "react";

type FileUploadProps = React.ComponentPropsWithoutRef<'div'> & {
    onFileSelected?: (file: File) => void;
    label?: string;
}

const FileUpload: FC<FileUploadProps> = ({
    onFileSelected,
    label = "Select file",
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
    <div {...otherProps}>
        <Card isHoverable={true} onClick={handleBrowse} isPressable={true} className="w-full">
            <CardFooter className="gap-4 justify-between">
                <div className="flex gap-4"><Chip radius="sm" variant="light">{label}: </Chip><Chip radius="sm" variant="flat">{file?.name}</Chip></div>
                {/* <Button onClick={handleBrowse} variant="bordered" color="success">Browse</Button> */}
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
      </div>   
  );
}


export default FileUpload;