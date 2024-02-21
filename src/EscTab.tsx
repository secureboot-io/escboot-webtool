import { Button, Card, CardBody, CardFooter, CardHeader, Input, Tab, Tabs, Textarea } from "@nextui-org/react";
import { FC, useEffect } from "react";
import { CommonEscInfo, EscInfo, useStore } from "./StoreProvider";
import Logger from "./Logger";
import React from "react";
import EscNumTab from "./EscNumTab";
import { isEqual } from "lodash";
import FileUpload from "./FileUpload";
import { Buffer } from "buffer";

const EscTab: FC = () => {

    const store = useStore();
    const [connecting, setConnecting] = React.useState(false);
    const [escInfos, setEscInfos] = [store.escInfos, store.setEscInfos];
    const [commonEscInfo, setCommonEscInfo] = [store.commonEscInfo, store.setCommonEscInfo];
    const escOperations = store.escOperations;
    const [privateKey, setPrivateKey] = React.useState<string | null>(null);
    const [data, setData] = React.useState("");
    const [address, setAddress] = React.useState("0x0000f101");
    const log = Logger.getInstance();

    // useEffect(() => {
    //     handleRead();
    // }, [])

    const identifyCommonProperties = (esc: (EscInfo | null)[]) => {
        let validInfos = esc.filter((escInfo) => escInfo !== null).map((escInfo) => {
            return {
                secure: escInfo?.secure ?? false,
                manufacturerId: escInfo?.deviceInfo.manufacturerId ?? "",
                manufacturerPublicKey: escInfo?.deviceInfo.manufacturerPublicKey ?? ""
            } as CommonEscInfo;
        });
        if (validInfos.length === 0) {
            console.log("No valid ESCs found");
            return;
        }
        let validInfo = validInfos[0];
        if (validInfos.filter((info) => isEqual(info, validInfo)).length !== validInfos.length) {
            return;
        }
        setCommonEscInfo(validInfo);
    }

    const handleRead = async () => {
        setConnecting(true);
        let esc: (EscInfo | null)[] = [null, null, null, null];
        for (let i = 0; i < 4; i++) {
            let fourWay = await escOperations?.connectToTarget(i);
            let resp = await fourWay?.getSecureBootInitialized();
            if (resp === undefined || resp === null) {
                log.error("Failed to connect to ESC " + (i + 1));
                await escOperations?.disconnectFromTarget(i);
                continue;
            } else {
                log.info("Connected to ESC " + (i + 1));
            }
            let devInfo = await fourWay?.secureBootGetDeviceInfo();
            if (devInfo === undefined || devInfo === null) {
                await escOperations?.disconnectFromTarget(i);
                log.error("Failed to read device info from ESC " + (i + 1));
                continue;
            }
            esc[i] = {
                secure: resp,
                deviceInfo: devInfo
            }
            await escOperations?.disconnectFromTarget(i);
        }
        setEscInfos(esc);
        identifyCommonProperties(esc);
        setConnecting(false);
    }

    const setCommonManufacturerId = (value: string) => {
        setCommonEscInfo({
            ...commonEscInfo, manufacturerId: value
        } as CommonEscInfo);
    }

    const setCommonManufacturerPublicKey = (value: string) => {
        setCommonEscInfo({
            ...commonEscInfo, manufacturerPublicKey: value
        } as CommonEscInfo);
    }

    const handlePrivateKeyRead = (e: ProgressEvent<FileReader>) => {
        const content: string = e.target?.result as string;
        setPrivateKey(Buffer.from(content, 'base64').toString('hex'));
    }

    const handlePrivateKeySelect = (f: File) => {
        let fileReader = new FileReader();
        fileReader.onloadend = handlePrivateKeyRead;
        fileReader.readAsText(f);
    }

    const handleWriteSign = async () => {
    }

    return (
        <Card className='flex-grow'>
            <CardBody className="gap-4">
                {commonEscInfo !== null &&
                    <><Input type="text" label="Manufacturer Id"
                        disabled={commonEscInfo.secure}
                        value={commonEscInfo.manufacturerId}
                        onValueChange={setCommonManufacturerId} />
                        <Input type="text" label="Manufacturer Public key"
                            disabled={commonEscInfo.secure}
                            value={commonEscInfo.manufacturerPublicKey}
                            onValueChange={setCommonManufacturerPublicKey} /></>
                }

                {escInfos.map((esc, index) => {
                    return (esc !== null &&
                        <EscNumTab target={index} />
                    );
                })}
            </CardBody>
            <CardFooter className="flex flex-row gap-4">
                <FileUpload onFileSelected={handlePrivateKeySelect} className="flex-grow" />
                <Button color="success" onClick={handleRead} isLoading={connecting}>Read All</Button>
                <Button color="success" onClick={handleRead} isLoading={connecting}>Protect</Button>
                <Button color="success" onClick={handleRead} isLoading={connecting}>Unprotect</Button>
            </CardFooter>
        </Card>

    );
}

export default EscTab;