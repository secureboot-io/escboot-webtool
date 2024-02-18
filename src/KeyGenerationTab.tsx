import { Button, Card, CardBody, CardFooter, Code, Divider } from "@nextui-org/react";
import React, { useState } from "react";
import { FC } from "react";
import { useStore } from "./StoreProvider";
import Logger from "./Logger";
import ec from 'elliptic';
import save from "save-file";
import { Buffer } from "buffer";

const KeyGenerationTab: FC = () => {

    const store = useStore();
    const log = Logger.getInstance();  
    const [generated, setGenerated] = useState(false);
    const [publicKey, setPublicKey] = useState<Blob>();
    const [privateKey, setPrivateKey] = useState<Blob>();

    const convertData = (file: string) => {
        let base64encoded = Buffer.from(file, 'hex').toString('base64');
        let byteArray = new Uint8Array(base64encoded.split("").map(c => c.charCodeAt(0)));
        let blob = new Blob([byteArray], {type: "application/octet-stream"});
        return blob;
    }

    const handleGenerate = () => {
        let c = new ec.ec('secp256k1');
        let keyPair = c.genKeyPair();

        let pub = keyPair.getPublic('hex');
        let priv = keyPair.getPrivate('hex');

        setPublicKey(convertData(pub));
        setPrivateKey(convertData(priv));

        setGenerated(true);
    }

    const handleSavePrivate = () => {
        save(privateKey, 'private.pem');
    }

    const handleSavePublic = () => {
        save(publicKey, 'public.pem');
    }

    const handleClear = () => {
        setGenerated(false);
        setPublicKey(undefined);
        setPrivateKey(undefined);
    }

    return (
        <Card className='w-full h-full'>
            <CardBody className="flex flex-col">
                <div className="flex flex-row gap-4">
                    {generated ? (
                        <>
                            <Button onClick={handleSavePrivate} color="success" size="lg">
                                Save Private
                            </Button>  
                            <Button onClick={handleSavePublic} color="success" size="lg">
                                Save Public
                            </Button>
                            <Button onClick={handleClear} color="warning" variant="light" size="lg">
                                Clear
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleGenerate} color="success" size="lg">
                            Generate
                        </Button>  
                    )}
                    
                </div>
                <br/>
            <p>Or run the following commands to generate a new key pair manually.</p><br/>
            <Code className="font-mono">
$ openssl ecparam -name prime256v1 -genkey -noout -out private.ec.key<br/>
$ openssl ec -in private.pem -pubout -out public.pem
            </Code>
            </CardBody>
        </Card>

    );
}

export default KeyGenerationTab;