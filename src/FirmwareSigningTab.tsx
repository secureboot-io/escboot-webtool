import { Card, CardBody, CardFooter } from "@nextui-org/react";
import React, {  } from "react";
import { FC } from "react";
import { useStore } from "./StoreProvider";
import Logger from "./Logger";



const FirmwareSigningTab: FC = () => {

    const store = useStore();
    const log = Logger.getInstance();


    return (
        <Card className='w-full h-full'>
            <CardBody>
                
            </CardBody>
            <CardFooter className="justify-end space-x-4">

            </CardFooter>
        </Card>

    );
}

export default FirmwareSigningTab;