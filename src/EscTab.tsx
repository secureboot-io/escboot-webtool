import { Button, Card, CardBody, CardFooter, CardHeader, Chip, Input, Switch, Tab, Tabs, Textarea } from "@nextui-org/react";
import React, { ChangeEvent, useEffect } from "react";
import { FC } from "react";
import { SecureIcon } from "./icons/Secure";
import { UnsecureIcon } from "./icons/Unsecure";
import { useStore } from "./StoreProvider";
import ConfirmDialog from "./ConfirmDialog";
import SerialComm from "./SerialComm";
import { useLog } from "./LogProvider";
import Logger from "./Logger";
import { FourWay } from "./FourWay";
import Msp, { MSP_COMMANDS } from "./Msp";



const EscTab: FC = () => {

    const store = useStore();
    const [secure, setSecure] = [store.secure, store.setSecure];
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [ports, setPorts] = [store.ports, store.setPorts];
    const [selectedPort, setSelectedPort] = [store.selectedPort, store.setSelectedPort];
    const [connecting, setConnecting] = React.useState(false);
    const [manufacturerId, setManufacturerId] = React.useState("");
    const [deviceId, setDeviceId] = React.useState("");
    const [manufacturerPublicKey, setManufacturerPublicKey] = React.useState("");
    const [devicePublicKey, setDevicePublicKey] = React.useState("");
    const log = Logger.getInstance();

    // useEffect(() => {
    //     if(selectedPort < 0)
    //         return;
    //     if(connecting)
    //         return;
    //     loadDeviceInfo();
    // }, [selectedPort]);

    const loadDeviceInfo = async () => {
        setConnecting(true);
        let port = ports[selectedPort];
        let serialComm = new SerialComm(port);
        await serialComm.connect();
        log.info("Port connected: " + selectedPort);

        let fourWay = new FourWay(serialComm)
        let msp = new Msp(serialComm);

        try {
            let data = await msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
            //let data = await msp.readWithTimeout(500);
            console.log(data);
        } catch (e) {
            console.log(e);
        }

        let resp = await fourWay.initFlash(0, 10);
        console.log(resp);

        let deviceInfo = await fourWay.secureBootGetDeviceInfo();
        if(deviceInfo === null) {
            log.error("Device info is null");
            return;
        }
        setManufacturerId(deviceInfo.manufacturerId);
        setDeviceId(deviceInfo.deviceId);
        setManufacturerPublicKey(deviceInfo.manufacturerPublicKey);
        setDevicePublicKey(deviceInfo.devicePublicKey);
        console.log(deviceInfo);

        resp = await fourWay.exitInterface(0, 10);
        console.log(resp);
        serialComm.disconnect();
        setConnecting(false);
    }

    const saveDeviceInfo = async () => {
        setConnecting(true);
        let port = ports[selectedPort];
        let serialComm = new SerialComm(port);
        await serialComm.connect();
        log.info("Port connected: " + selectedPort);

        let fourWay = new FourWay(serialComm)
        let msp = new Msp(serialComm);

        try {
            let data = await msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
            //let data = await msp.readWithTimeout(500);
            console.log(data);
        } catch (e) {
            console.log(e);
        }

        let resp = await fourWay.initFlash(0, 10);
        console.log(resp);

        let resp2 = await fourWay.secureBootSetDeviceInfo(manufacturerId, deviceId, manufacturerPublicKey);
        resp2 = await fourWay.exitInterface(0, 10);
        console.log(resp);
        serialComm.disconnect();
        setConnecting(false);
    }

    const doProtect = async () => {
        setConnecting(true);
        let port = ports[selectedPort];
        let serialComm = new SerialComm(port);
        await serialComm.connect();
        log.info("Port connected: " + selectedPort);

        let fourWay = new FourWay(serialComm)
        let msp = new Msp(serialComm);

        try {
            let data = await msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
            //let data = await msp.readWithTimeout(500);
            console.log(data);
        } catch (e) {
            console.log(e);
        }

        let resp = await fourWay.initFlash(0, 10);
        console.log(resp);

        await fourWay.secureBootInitialize();

        let resp2 = await fourWay.getSecureBootInitialized();
        log.info("Secure boot initialized: " + resp2);
        setSecure(resp2!);  

        resp = await fourWay.exitInterface(0, 10);
        console.log(resp);
        await serialComm.disconnect();
        setConnecting(false);
        loadDeviceInfo();
    }

    const doUnprotect = async () => {
        setConnecting(true);
        let port = ports[selectedPort];
        let serialComm = new SerialComm(port);
        await serialComm.connect();
        log.info("Port connected: " + selectedPort);

        let fourWay = new FourWay(serialComm)
        let msp = new Msp(serialComm);

        try {
            let data = await msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
            //let data = await msp.readWithTimeout(500);
            console.log(data);
        } catch (e) {
            console.log(e);
        }

        let resp = await fourWay.initFlash(0, 10);
        console.log(resp);

        await fourWay.secureBootDeinitialize();

        let resp2 = await fourWay.getSecureBootInitialized();
        log.info("Secure boot initialized: " + resp2);
        setSecure(resp2!);  

        resp = await fourWay.exitInterface(0, 10);
        console.log(resp);
        await serialComm.disconnect();
        setConnecting(false);
        loadDeviceInfo();
    }

    const handleProtect = () => {
        doProtect();
    }

    const handleUnprotect = () => {
        setIsConfirmOpen(true);
    }

    const handleUnprotectConfirm = () => {
        setIsConfirmOpen(false);
        doUnprotect();
    }

    const handleRead = () => {
        loadDeviceInfo();
    }

    const handleSign = () => {
        console.log("Sign");
    }

    const handleWrite = () => {
        saveDeviceInfo();
    }

    return (
        <Card className='w-full h-full'>
            <CardBody>
                <Tabs>
                    <Tab key="esc1" title="ESC 1">
                        <div className="flex flex-col space-y-4">
                            <ConfirmDialog title="Unprotect" message="Are you sure you want to unprotect the device?" onConfirm={handleUnprotectConfirm}
                                onCancel={() => { }} open={isConfirmOpen} confirmText="Unprotect" />
                            <div className="flex flex-row space-x-4 justify-end">
                                {secure ? (
                                    <Chip variant="flat" color='success' className="float-right" startContent={<SecureIcon></SecureIcon>}>Secure</Chip>
                                ) : (
                                    <Chip color="warning" variant="flat" className="float-right" startContent={<UnsecureIcon></UnsecureIcon>}>Unsecure</Chip>
                                )}
                            </div>
                            <Input type="text" label="Manufacturer Id" disabled={secure} value={manufacturerId} onValueChange={setManufacturerId} />
                            <Input type="text" label="Device Id" disabled={secure} value={deviceId} onValueChange={setDeviceId} />
                            <Textarea label="Manufacturer Public Key" disabled={secure} value={manufacturerPublicKey} onValueChange={setManufacturerPublicKey} className="font-mono"></Textarea>
                            <Textarea label="Device Public Key" disabled={true} value={devicePublicKey} className="font-mono"></Textarea>
                        </div>
                    </Tab>
                </Tabs>  
            </CardBody>
            <CardFooter className="justify-end space-x-4">
                <Button color="success" onClick={handleRead} isLoading={connecting}>Read</Button>
                {secure ? (
                    <>
                        <Button color="success" onClick={handleSign} isLoading={connecting}>Sign</Button>
                        <Button color="warning" onClick={handleUnprotect} isLoading={connecting}>Unprotect</Button>
                    </>
                ) : (
                    <>
                        <Button color="success" onClick={handleWrite} isLoading={connecting}>Write</Button>
                        <Button color="success" onClick={handleProtect} isLoading={connecting}>Protect</Button>
                    </>
                )}
            </CardFooter>
        </Card>

    );
}

export default EscTab;