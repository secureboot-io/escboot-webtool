import AsyncLock from "./AsyncLock";
import { FourWay } from "./FourWay";
import Msp, { MSP_COMMANDS } from "./Msp";
import SerialComm from "./SerialComm";

// export const with
export default class EscOperations {

    private asyncLock: AsyncLock;
    private fourWay: FourWay;
    private msp: Msp;
    private serialComm: SerialComm;

    constructor(serialComm : SerialComm) {
        this.asyncLock = new AsyncLock();
        this.fourWay = new FourWay(serialComm);
        this.msp = new Msp(serialComm);
        this.serialComm = serialComm;
    }   

    public async connectToTarget(target: number) {
        await this.asyncLock.promise;
        this.asyncLock.enable();

        try {
            await this.msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
        } catch (e) {
            await this.fourWay.exitInterface(target);
            await this.msp.send(MSP_COMMANDS.MSP_SET_PASSTHROUGH, new Uint8Array());
        }

        await this.fourWay.initFlash(target);

        return this.fourWay;
    }


    public async disconnectFromTarget(target: number) {
        let fourWay = this.fourWay;
        await fourWay.exitInterface(target);
        this.asyncLock.disable();
    }

    public async disconnect() {
        await this.serialComm.disconnect();
    }
}