import { Button, Card, CardBody, CardHeader, Chip, Input, Textarea } from "@nextui-org/react";
import { FC } from "react";
import { SecureIcon } from "./icons/Secure";
import { UnsecureIcon } from "./icons/Unsecure";
import { useStore } from "./StoreProvider";
import ConfirmDialog from "./ConfirmDialog";
import Logger from "./Logger";
import React from "react";

interface EscNumTabProps {
    target: number
    requestProtect: (target: number) => void
    requestUnprotect: (target: number) => void
    requestWrite: (target: number) => void
}

const EscNumTab: FC<EscNumTabProps> = (
    { target, requestProtect, requestUnprotect, requestWrite }
) => {

    const store = useStore();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);
    const secure = store.escInfos[target]!.secure;
    const [escInfos, setEscInfos] = [store.escInfos, store.setEscInfos];
    const [commonEscInfo, setCommonEscInfo] = [store.commonEscInfo, store.setCommonEscInfo]

    const setManufacturerId = (value: string) => {
        const newEscInfos = [...escInfos];
        newEscInfos[target]!.deviceInfo.manufacturerId = value;
        setEscInfos(newEscInfos);
        setCommonEscInfo(null);
    }

    const setManufacturerPublicKey = (value: string) => {
        const newEscInfos = [...escInfos];
        newEscInfos[target]!.deviceInfo.manufacturerPublicKey = value;
        setEscInfos(newEscInfos);
        setCommonEscInfo(null);
    }

    const setDeviceId = (value: string) => {
        const newEscInfos = [...escInfos];
        newEscInfos[target]!.deviceInfo.deviceId = value;
        setEscInfos(newEscInfos);
    }

    const manufacturerId = escInfos[target]!.deviceInfo.manufacturerId;
    const deviceId = escInfos[target]!.deviceInfo.deviceId;
    const manufacturerPublicKey = escInfos[target]!.deviceInfo.manufacturerPublicKey;
    const devicePublicKey = escInfos[target]!.deviceInfo.devicePublicKey;

    const log = Logger.getInstance();

    const handleProtect = () => {
        requestProtect(target);
    }

    const handleUnprotect = () => {
        setIsConfirmOpen(true);
    }

    const handleUnprotectConfirm = () => {
        setIsConfirmOpen(false);
        requestUnprotect(target);
    }

    const handleWrite = () => {
        requestWrite(target);
    }

    return (
        <Card>
            <CardHeader className="justify-between">
                <h4>ESC {target + 1}</h4>
                <div className="flex flex-row justify-end gap-2">
                    {escInfos[target]?.secure ? (
                        <Chip radius="sm" variant="flat" color='success' className="float-right" startContent={<SecureIcon></SecureIcon>}>{devicePublicKey}</Chip>
                    ) : (
                        <Chip radius="sm" color="warning" variant="flat" className="float-right" startContent={<UnsecureIcon></UnsecureIcon>}>Unprotected</Chip>
                    )}
                </div>
            </CardHeader>
            <CardBody className="gap-4">
                <div className="flex flex-row space-x-4 justify-between">


                </div>
                <ConfirmDialog title="Unprotect" message="Are you sure you want to unprotect the device?" onConfirm={handleUnprotectConfirm}
                    onCancel={() => { }} open={isConfirmOpen} confirmText="Unprotect" />
                {commonEscInfo === null &&
                    <Input type="text" label="Manufacturer Id" disabled={secure} value={manufacturerId} onValueChange={setManufacturerId} />
                }
                <Input type="text" label="Device Id" disabled={secure} value={deviceId} onValueChange={setDeviceId} />
                {commonEscInfo === null &&
                    <Textarea label="Manufacturer Public Key" disabled={secure} value={manufacturerPublicKey} onValueChange={setManufacturerPublicKey} className="font-mono"></Textarea>
                }

                {escInfos[target]?.secure && (
                    <>

                    </>
                )}
                <div className="flex flex-row space-x-4 justify-end">
                    {escInfos[target]?.secure ? (
                        <>
                            <Button color="warning" onClick={handleUnprotect} isLoading={connecting}>Unprotect</Button>
                        </>
                    ) : (
                        <>
                            <Button color="success" onClick={handleWrite} isLoading={connecting}>Write</Button>
                            <Button color="success" onClick={handleProtect} isLoading={connecting}>Protect</Button>
                        </>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}

export default EscNumTab;