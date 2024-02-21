import { Button, Card, CardBody, CardFooter, CardHeader, Chip, Input, Tab, Tabs, Textarea } from "@nextui-org/react";
import { FC, useEffect } from "react";
import { SecureIcon } from "./icons/Secure";
import { UnsecureIcon } from "./icons/Unsecure";
import { useStore } from "./StoreProvider";
import ConfirmDialog from "./ConfirmDialog";
import Logger from "./Logger";
import { FourWay } from "./FourWay";
import React from "react";
import { Buffer } from "buffer";
import KJUR from 'jsrsasign';
import FileUpload from "./FileUpload";
import Msp, { MSP_COMMANDS } from "./Msp";

interface EscNumTabProps {
    target: number
}

const EscNumTab: FC<EscNumTabProps> = (
    {target}
) => {

    const store = useStore();
    const [secure, setSecure] = React.useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const escOperations = store.escOperations;
    //const [selectedPort, setSelectedPort] = useState(-1);
    const [connecting, setConnecting] = React.useState(false);
    const [manufacturerId, setManufacturerId] = React.useState("");
    const [deviceId, setDeviceId] = React.useState("");
    const [manufacturerPublicKey, setManufacturerPublicKey] = React.useState("");
    const [devicePublicKey, setDevicePublicKey] = React.useState("");
    const [signReady, setSignReady] = React.useState(false);
    const [privateKey, setPrivateKey] = React.useState<string | null>(null);
    const [rawDeviceInfo, setRawDeviceInfo] = React.useState(new Uint8Array());
    const [data, setData] = React.useState("");
    const [address, setAddress] = React.useState("0x0000f101");
    const log = Logger.getInstance();

    useEffect(() => {
        handleRead();
    }, []);

    const loadDeviceInfo = async () => {
        setConnecting(true);

        let fourWay = await escOperations!.connectToTarget(0);

        let s = await fourWay.getSecureBootInitialized();
        setSecure(s!);
        let deviceInfo = await fourWay.secureBootGetDeviceInfo();
        if(deviceInfo === null) {
            log.error("Device info is null");
            return;
        }

        await escOperations!.disconnectFromTarget(0);
        
        setManufacturerId(deviceInfo.manufacturerId);
        setDeviceId(deviceInfo.deviceId);
        setManufacturerPublicKey(deviceInfo.manufacturerPublicKey);
        setDevicePublicKey(deviceInfo.devicePublicKey);
        setRawDeviceInfo(deviceInfo.raw);

        setConnecting(false);
        setSignReady(true);
    }

    const saveDeviceInfo = async () => {
        setConnecting(true);

        let fourWay = await escOperations!.connectToTarget(0);

        let resp = await fourWay.secureBootSetDeviceInfo(manufacturerId, deviceId, manufacturerPublicKey);

        await escOperations!.disconnectFromTarget(0);

        setConnecting(false);
    }

    const doProtect = async () => {
        setConnecting(true);

        let fourWay = await escOperations!.connectToTarget(0);

        await fourWay.secureBootInitialize();

        let resp2 = await fourWay.getSecureBootInitialized();
        log.info("Secure boot initialized: " + resp2);
        setSecure(resp2!);  

        await escOperations!.disconnectFromTarget(0);

        setConnecting(false);
        loadDeviceInfo();
    }

    const doUnprotect = async () => {
        setConnecting(true);

        let fourWay = await escOperations!.connectToTarget(0);
 
        await fourWay.secureBootDeinitialize();

        let resp2 = await fourWay.getSecureBootInitialized();
        log.info("Secure boot initialized: " + resp2);
        setSecure(resp2!);  

        await escOperations!.disconnectFromTarget(0);

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

    const handleFileRead = (e: ProgressEvent<FileReader>) => {
        const content: string = e.target?.result as string;
        setPrivateKey(Buffer.from(content, 'base64').toString('hex'));
    }

    const handleFileSelect = (f: File) => {
        let fileReader = new FileReader();
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText(f);
    }

    const handleWriteSign = async () => {
        setConnecting(true);

        var ec = new KJUR.KJUR.crypto.ECDSA({'curve': 'secp256k1'});
        var sigValueHex = ec.signHex(Buffer.from(data, 'base64').toString('hex'), privateKey!);
        
        if(sigValueHex.startsWith("30450220")) {
            sigValueHex = sigValueHex.substring(8);
        } else if(sigValueHex.startsWith("30440220")) {
            sigValueHex = sigValueHex.substring(8);
        } else if(sigValueHex.startsWith("3045022100")) {
            sigValueHex = sigValueHex.substring(10);
        } else if(sigValueHex.startsWith("3046022100")) {
            sigValueHex = sigValueHex.substring(10);
        }

        let r = sigValueHex.substring(0, 64);
        let s = sigValueHex.substring(sigValueHex.length - 64);

        let sig2 = Buffer.from(r + s, 'hex');

        let fourWay = await escOperations!.connectToTarget(0);

        await fourWay.secureWriteSignature(parseInt(address), sig2);

        await escOperations!.disconnectFromTarget(0);

        setConnecting(false);
    }

    const handleSign = async () => {
        setConnecting(true);

        var curve = "secp256k1"; 
        var signature_algo = "SHA256withECDSA";

        //Message for encrypting
        var msg = "Hello";

        //Generating Signature
        var sig = new KJUR.KJUR.crypto.Signature({"alg": signature_algo});
        sig.init({d: privateKey!, curve: curve});
        sig.updateHex(Buffer.from(rawDeviceInfo).toString('hex'));
        var sigValueHex = sig.sign();
        if(sigValueHex.startsWith("30450220")) {
            sigValueHex = sigValueHex.substring(8);
        } else if(sigValueHex.startsWith("30440220")) {
            sigValueHex = sigValueHex.substring(8);
        } else if(sigValueHex.startsWith("3045022100")) {
            sigValueHex = sigValueHex.substring(10);
        } else if(sigValueHex.startsWith("3046022100")) {
            sigValueHex = sigValueHex.substring(10);
        }

        let r = sigValueHex.substring(0, 64);
        let s = sigValueHex.substring(sigValueHex.length - 64);

        let sig2 = Buffer.from(r + s, 'hex');

        let fourWay = await escOperations!.connectToTarget(0);

        await fourWay.secureBootSign(sig2);

        await escOperations!.disconnectFromTarget(0);

        setConnecting(false);
        loadDeviceInfo();
    }

    const handleWrite = () => {
        saveDeviceInfo();
    }

    return (
        <div className="flex flex-col space-y-4 overflow-hidden">
                <div className="flex flex-row space-x-4 justify-end">
                    {secure ? (
                        <Chip variant="flat" color='success' className="float-right" startContent={<SecureIcon></SecureIcon>}>Secure</Chip>
                    ) : (
                        <Chip color="warning" variant="flat" className="float-right" startContent={<UnsecureIcon></UnsecureIcon>}>Unsecure</Chip>
                    )}
                </div>
                <ConfirmDialog title="Unprotect" message="Are you sure you want to unprotect the device?" onConfirm={handleUnprotectConfirm}
                    onCancel={() => { }} open={isConfirmOpen} confirmText="Unprotect" />
                
                <Input type="text" label="Manufacturer Id" disabled={secure} value={manufacturerId} onValueChange={setManufacturerId} />
                <Input type="text" label="Device Id" disabled={secure} value={deviceId} onValueChange={setDeviceId} />
                <Textarea label="Manufacturer Public Key" disabled={secure} value={manufacturerPublicKey} onValueChange={setManufacturerPublicKey} className="font-mono"></Textarea>
                <Textarea label="Device Public Key" disabled={true} value={devicePublicKey} className="font-mono"></Textarea>
                {secure && (
                    <>
                        <FileUpload onFileSelected={handleFileSelect} />
                        {privateKey !== null && (
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <p>Write Signature</p>
                                </CardHeader>
                                <CardBody>
                                    <Textarea label="Data" value={data} onValueChange={setData}></Textarea>
                                </CardBody>
                                <CardFooter className="flex flex-row gap-4">
                                    <Input type="text" value={address} onValueChange={setAddress} label="Address" labelPlacement="outside-left"/>
                                    <Button color="success" onClick={handleWriteSign}>Write</Button>
                                </CardFooter>
                            </Card>
                        )}
                    </>
                )}
                <div className="flex flex-row space-x-4 justify-right">
                    {secure ? (
                        <>
                            <Button color="success" onClick={handleSign} isLoading={connecting} disabled={!signReady || privateKey === null}>Sign</Button>
                            <Button color="warning" onClick={handleUnprotect} isLoading={connecting}>Unprotect</Button>
                        </>
                    ) : (
                        <>
                            <Button color="success" onClick={handleWrite} isLoading={connecting}>Write</Button>
                            <Button color="success" onClick={handleProtect} isLoading={connecting}>Protect</Button>
                        </>
                    )}
                </div>
        </div>

    );
}

export default EscNumTab;