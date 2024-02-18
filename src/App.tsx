import { ChangeEvent, FC, useEffect, useState } from 'react';

import { Navbar, NavbarContent, NavbarItem, Button, Divider, Spacer, CardHeader, Select, SelectItem } from "@nextui-org/react";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";

import SerialComm from "./SerialComm";
import Log from './Log';
import React from 'react';
import Msp, { MSP_COMMANDS } from './Msp';
import { FourWay } from './FourWay';
import { useLog } from './LogProvider';
import Logger from './Logger';

import EscTab from './EscTab';
import { useStore } from './StoreProvider';
import KeyGenerationTab from './KeyGenerationTab';
import FirmwareSigningTab from './FirmwareSigningTab';

const App: FC = () => {
    Logger.init(useLog());
    const log = Logger.getInstance();

    const store = useStore();

    const [selectedPort, setSelectedPort] = [store.selectedPort, store.setSelectedPort]
    const [ports, setPorts] = [store.ports, store.setPorts]
    const [connecting, setConnecting] = useState<boolean>(false);
    const [connected, setConnected] = useState<boolean>(false);
    const [secure, setSecure] = [store.secure, store.setSecure];
    const [selectedTab, setSelectedTab] = useState("ESC");

    const updatePorts = async () => {
        let ports = await SerialComm.getPorts();
        setPorts(ports);
        if (ports.length == 0) {
            setSelectedPort(-1);
        } else if (ports.length == 1) {
            setSelectedPort(0);
        }
    }

    const handleSelectPort = async () => {
        await SerialComm.requestPorts();
        updatePorts();
    }

    const handleForgetPort = async () => {
        let ports = await SerialComm.getPorts();
        SerialComm.forgetPort(ports[selectedPort]);
        log.info("Port " + selectedPort + " forgotten");
        updatePorts();
    }

    const handleChangePort = (event: ChangeEvent<HTMLSelectElement>) => {
        let value: number = -1;
        if (parseInt(event.target.value, 10) >= 0) {
            value = parseInt(event.target.value, 10);
        }
        setSelectedPort(value);
        log.info("Port selected: " + value);
    }

    const handleDisconnect = async () => {
        setConnected(false);
        log.info("Port disconnected: " + selectedPort);
    }

    const handleConnect = async () => {
        setConnecting(true);
        let ports = await SerialComm.getPorts();
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

        // resp = await fourWay.readAddress(0xF7FFF000, 2);
        // console.log(resp);

        let resp2 = await fourWay.getSecureBootInitialized();
        log.info("Secure boot initialized: " + resp2);
        setSecure(resp2!);

        resp2 = await fourWay.getSecureBootEnabled();
        log.info("Secure boot enabled: " + resp2);

        //await fourWay.secureBootInitialize();

        resp = await fourWay.exitInterface(0, 10);
        console.log(resp);
        serialComm.disconnect();
        setConnecting(false);
        setConnected(true);
        setSelectedTab("ESC");
    }

    useEffect(() => {
        updatePorts();
    }, []);

    return (
        <>

            <div className="px-4 flex-grow mx-8 flex flex-col" >
                <Navbar maxWidth="full">
                    <NavbarContent justify="start">
                        <h1 className="text-2xl">ESC Secure Boot</h1>
                    </NavbarContent>
                    <NavbarContent justify="end">
                        <Button variant="bordered" color='warning' onClick={handleSelectPort} disabled={connecting || connected}>
                            Request
                        </Button>
                        <Select
                            defaultSelectedKeys={"0"}
                            disallowEmptySelection={true}
                            selectionMode='single'
                            labelPlacement='outside-left'
                            name="selectPort"
                            label="Select port"
                            className="max-w-xs"
                            onChange={handleChangePort}
                            isDisabled={connecting || connected}
                        >
                            {ports.map((port, i) => (
                                <SelectItem key={i}>
                                    {i + ": " + port.getInfo().usbVendorId + ":" + port.getInfo().usbProductId}
                                </SelectItem>
                            ))}
                        </Select>
                        <NavbarItem>
                            <Button color='warning' variant='bordered' onClick={handleForgetPort} disabled={selectedPort < 0 || connecting || connected}>
                                Forget
                            </Button>
                        </NavbarItem>
                        <NavbarItem>
                            {(connecting || !connected) ? (
                                <Button variant='bordered' isLoading={connecting} color="success" onClick={handleConnect} disabled={selectedPort < 0 || connecting}>
                                    Connect
                                </Button>
                            ) : (
                                <Button color="warning" onClick={handleDisconnect} disabled={connecting}>
                                    Disconnect
                                </Button>
                            )}
                        </NavbarItem>
                    </NavbarContent>
                </Navbar>
                <Card className="m-unit-2">
                    <CardHeader>
                        <h5 className="text-sm tracking-tight">Activity</h5>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <Log />
                    </CardBody>
                </Card>
                <Spacer y={2} />
                <div className="flex h-full w-full flex-col mb-8" style={{ alignItems: "center" }}>
                    
                        <Tabs aria-label="Options" className='' selectedKey={selectedTab} onSelectionChange={key => setSelectedTab(key.toString())}>
                        {connected && (
                            <Tab key="ESC" title="ESC" className='w-full h-full'>
                                <EscTab></EscTab>                              
                            </Tab>
                            )}
                            <Tab key="music" title="Firmware Signing" className='w-full h-full'>
                                <FirmwareSigningTab/>
                            </Tab>
                            <Tab key="videos" title="Key Generation"className='w-full h-full'>
                                <KeyGenerationTab/>
                            </Tab>
                        </Tabs>
                    

                </div>
            </div>
        </>
    );

}

export default App;