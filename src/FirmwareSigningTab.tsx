import { Button, Card, CardBody, CardFooter } from "@nextui-org/react";
import React, {  } from "react";
import { FC } from "react";
import { useStore } from "./StoreProvider";
import Logger from "./Logger";
import FileUpload from "./FileUpload";
import FileReaderAsync from "./FileReaderAsync";
import {Buffer} from "buffer";

const FirmwareSigningTab: FC = () => {

    const [key, setKey] = React.useState<File | null>(null);
    const [firmware, setFirmware] = React.useState<File | null>(null);

    const store = useStore();
    const log = Logger.getInstance();

    const handleKeySelect = (file: File) => {
        setKey(file);
    };

    const handleFirmwareSelect = (file: File) => {
        setFirmware(file);
    };

    const handleSign = async () => {
        if(key && firmware) {
            log.info("Signing firmware with key: " + key.name);
            const fileReader = new FileReaderAsync();
            const keyData = await fileReader.readAsText(key);
            const firmwareData: string|null = await fileReader.readAsText(firmware);
            const firmwareDataLines = firmwareData?.split("\n");
            const vMem = new Uint8Array(0x7c00);
            const vMemOffset = 0x8001000;
            let upper = 0;
            vMem.fill(0xFF);
            if(firmwareDataLines === null || firmwareDataLines === undefined) {
                log.error("Firmware data is null or undefined");
                return;
            }
            for(let i = 0; i < firmwareDataLines.length; i++) {
                if(firmwareDataLines[i].startsWith(":")) {
                    const line = firmwareDataLines[i].substring(1);
                    const bytes = Buffer.from(line, "hex");
                    const length = bytes.readUInt8(0);
                    const address = bytes.readUInt16BE(1);
                    const type = bytes.readUInt8(3);
                    const data = bytes.slice(4, 4 + length);
                    const checksum = bytes.readUInt8(4 + length);
                    let sum = 0;
                    for(let j = 0; j < 4 + length; j++) {
                        sum += bytes.readUInt8(j);
                    }
                    sum = ~sum + 1;
                    sum = sum & 0xFF;
                    if(sum !== checksum) {
                        log.error("Checksum error at line " + i + " got " + checksum + " expected " + sum);
                        return;
                    }
                    if(type === 0) {
                        let addr = upper << 16 | address;
                        vMem.set(data, addr - vMemOffset);
                        continue;
                    }
                    if(type === 4) {
                        upper = data.readUInt16BE(0);
                        continue;
                    }
                    if(type === 5) {
                        log.info("ignoring record type 5");
                        continue;
                    }
                    if(type === 1) {
                        break;
                    }
                    log.error("Unknown record type " + type);
                    return;
                }
            }
            //console.log(keyData);
            //console.log(firmwareData);
        }
    }

    return (
        <Card className='w-full h-full'>
            <CardBody className="gap-4">
                <FileUpload label="Private key" onFileSelected={handleKeySelect} />
                <FileUpload label="Firmware" onFileSelected={handleFirmwareSelect} />
                <div className="flex flex-row justify-end">
                    <Button color="success" onClick={handleSign}>Sign</Button>
                </div>
            </CardBody>
            <CardFooter className="justify-end space-x-4">

            </CardFooter>
        </Card>

    );
}

export default FirmwareSigningTab;