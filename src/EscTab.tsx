import { Button, Card, CardBody, CardFooter, Tab, Tabs } from "@nextui-org/react";
import { FC, useEffect } from "react";
import { useStore } from "./StoreProvider";
import Logger from "./Logger";
import React from "react";
import EscNumTab from "./EscNumTab";

const EscTab: FC = () => {

    const store = useStore();
    const [connecting, setConnecting] = React.useState(false);
    const [detectedEsc, setDetectedEsc] = [store.detectedEsc, store.setDetectedEsc];
    const escOperations = store.escOperations;
    const log = Logger.getInstance();

    useEffect(() => {
        handleRead();
    }, []);

    const handleRead = async () => {
        setConnecting(true);
        let esc = [false, false, false, false];
        for(let i = 0; i < 4; i++) {
            let fourWay = await escOperations?.connectToTarget(i);
            let resp = await fourWay?.getSecureBootInitialized();
            if(resp !== null && resp !== undefined && resp === true) {
                esc[i] = true;
            }
            await escOperations?.disconnectFromTarget(i);
        }
        setDetectedEsc(esc);
        setConnecting(false);
    }

    return (
        <Card className='flex-grow'>
            <CardBody>
                <Tabs>
                    {detectedEsc.map((esc, index) => {
                        return (esc &&
                            <Tab key={index} title={"ESC " + (index + 1)}>
                                <EscNumTab target={index}/>
                            </Tab>
                        );
                    })}
                </Tabs>  
            </CardBody>
            <CardFooter className="justify-end space-x-4">
                <Button color="success" onClick={handleRead} isLoading={connecting}>Identify</Button>
            </CardFooter>
        </Card>

    );
}

export default EscTab;