import { delay } from "framer-motion";
import Logger, { LogInterface } from "./Logger";
import SerialComm from "./SerialComm";
import { Buffer } from "buffer";

export type DeviceInfo = {
    manufacturerId: string;
    manufacturerPublicKey: string;
    deviceId: string;
    devicePublicKey: string;
    raw: Uint8Array;
};

export enum FOUR_WAY_COMMANDS {
    cmd_InterfaceTestAlive = 0x30,
    cmd_ProtocolGetVersion = 0x31,
    cmd_InterfaceGetName = 0x32,
    cmd_InterfaceGetVersion = 0x33,
    cmd_InterfaceExit = 0x34,
    cmd_DeviceReset = 0x35,
    cmd_DeviceInitFlash = 0x37,
    cmd_DeviceEraseAll = 0x38,
    cmd_DevicePageErase = 0x39,
    cmd_DeviceRead = 0x3A,
    cmd_DeviceWrite = 0x3B,
    cmd_DeviceC2CK_LOW = 0x3C,
    cmd_DeviceReadEEprom = 0x3D,
    cmd_DeviceWriteEEprom = 0x3E,
    cmd_InterfaceSetMode = 0x3F,
};

export enum FOUR_WAY_ACK {
    ACK_OK = 0x00,
    ACK_I_UNKNOWN_ERROR = 0x01,
    ACK_I_INVALID_CMD = 0x02,
    ACK_I_INVALID_CRC = 0x03,
    ACK_I_VERIFY_ERROR = 0x04,
    ACK_D_INVALID_COMMAND = 0x05,
    ACK_D_COMMAND_FAILED = 0x06,
    ACK_D_UNKNOWN_ERROR = 0x07,
    ACK_I_INVALID_CHANNEL = 0x08,
    ACK_I_INVALID_PARAM = 0x09,
    ACK_D_GENERAL_ERROR = 0x0F,
};

type FourWayResponse = {
    command: number,
    address: number,
    ack: number,
    checksum: number,
    params: Uint8Array
};

export class FourWay {

    private serialComm: SerialComm;
    private log: LogInterface;

    constructor(serialComm: SerialComm) {
        this.serialComm = serialComm;
        this.log = Logger.getInstance();
    }

    public commandCount = 0;

    makePackage(cmd: FOUR_WAY_COMMANDS, params: Uint8Array, address: number) {
        if (params.length === 0) {
            params = new Uint8Array([0]);
        } else if (params.length > 256) {
            //this.logError('Too many parameters ' + params.length);
            return;
        }

        const bufferOut = new ArrayBuffer(7 + params.length);
        const bufferView = new Uint8Array(bufferOut);

        bufferView[0] = 0x2F;
        bufferView[1] = cmd;
        bufferView[2] = (address >> 8) & 0xFF;
        bufferView[3] = address & 0xFF;
        bufferView[4] = params.length === 256 ? 0 : params.length;

        // Copy params
        const outParams = bufferView.subarray(5);
        for (let i = 0; i < params.length; i += 1) {
            outParams[i] = params[i];
        }

        // Calculate checksum
        const msgWithoutChecksum = bufferView.subarray(0, -2);
        const checksum = msgWithoutChecksum.reduce(this.crc16XmodemUpdate, 0);

        bufferView[5 + params.length] = (checksum >> 8) & 0xFF;
        bufferView[6 + params.length] = checksum & 0xFF;

        return bufferOut;
    }

    crc16XmodemUpdate(crc: number, byte: number) {
        const poly = 0x1021;
        crc ^= byte << 8;
        for (let i = 0; i < 8; i += 1) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ poly;
            } else {
                crc <<= 1;
            }
        }

        return crc & 0xFFFF;
    }

    initFlash(target: number, retries = 10) {
        return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_DeviceInitFlash, new Uint8Array([target]), 0, retries);
    }

    exitInterface(target: number, retries = 10) {
        return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_InterfaceExit, new Uint8Array([target]), 0, retries);
    }

    async getSecureBootInitialized(retries = 10) {
        let resp = await this.readAddress(0x0000F000, 1, retries);
        if (resp === null) {
            return null;
        }
        if (resp.params[0] === 0x00) {
            return true;
        }
        if (resp.params[0] === 0xFF) {
            return false;
        }
        return null;
    }

    async readAddress(address: number, bytes: number, retries = 10) {
        return this.sendWithPromise(
            FOUR_WAY_COMMANDS.cmd_DeviceRead,
            new Uint8Array([bytes === 256 ? 0 : bytes]),
            address,
            retries
        );
    }

    async secureBootInitialize(retries = 10) {
        return await this.writeAddress(0x0000F000, new Uint8Array([0x00]));
    }


    async secureBootDeinitialize(retries = 10) {
        return await this.writeAddress(0x0000F000, new Uint8Array([0xFF]));
    }

    extractString(data: Uint8Array): string {
        let str = '';
        for (let i = 0; i < data.length; i++) {
            if (data[i] <= 0 || data[i] >= 128) {
                break;
            }
            str += String.fromCharCode(data[i]);
        }
        return str;
    }

    toBase64(byteArray: Uint8Array) {
        return Buffer.from(byteArray).toString('base64');
    }

    fromBase64(base64: string) {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }

    async secureBootGetDeviceInfo(retries = 10) : Promise<DeviceInfo | null> {
        let resp = await this.readAddress(0x0000F001, 192, retries);
        if (resp === null) {
            return null;
        }
        let deviceInfo = {
            manufacturerId: this.extractString(resp.params.subarray(0, 32)),
            deviceId: this.extractString(resp.params.subarray(32, 64)),
            manufacturerPublicKey: this.toBase64(resp.params.subarray(64, 128)),
            devicePublicKey: this.toBase64(resp.params.subarray(128, 192)),
            raw: resp.params
        }
        return deviceInfo;
    }

    async secureBootSetDeviceInfo(manufacturerId: string, deviceId: string, manufacturerPublicKey: string, retries = 10) {
        let data = new Uint8Array(128);
        let manId = new TextEncoder().encode(manufacturerId);
        let devId = new TextEncoder().encode(deviceId);
        let manPubKey = this.fromBase64(manufacturerPublicKey);
        data.fill(0xFF);
        data.set(manId, 0);
        data.set(devId, 32);
        data.set(manPubKey, 64);
        return await this.writeAddress(0x0000F001, data);
    }

    async secureBootSign(data: Uint8Array, retries = 1) {
        return await this.writeAddress(0x0000F0C1, data);
    }

    async secureWriteSignature(address: number, data: Uint8Array, retries = 1) {
        return await this.writeAddress(address, data);
    }

    async sendWithPromise(command: FOUR_WAY_COMMANDS, params: Uint8Array = new Uint8Array([]), address: number = 0, retries: number = 10): Promise<FourWayResponse | null> {
        const message = this.makePackage(command, params, address);

        if (!message) {
            //this.logError('message empty');
            throw new Error('message empty!');
        }

        let currentTry = 0;
    
        while (currentTry++ < retries) {
            await await this.serialComm.write(new Uint8Array(message));

            let buffer = await this.serialComm.readWithTimeout(9, 2000);
            if (buffer === null || buffer.length === 0) {
                this.log.warn("Recieved no reply from ESC for " + command + " try " + currentTry);
                break;
            }
            let response = await this.parseMessage(buffer);
            if (response.ack !== FOUR_WAY_ACK.ACK_OK) {
                //this.log.warn("Receieved NACK from ESC for " + command + " with code " + response.ack);
                break;
            }
            //this.log.info("ESC response OK for " + command);
            return response;
        }
        //this.log.error("error sending command");
        return null;
    }

    /**
   * Parse a message and invoke either resolve or reject callback
   *
   * @param {ArrayBuffer} buffer
   * @param {function} resolve
   * @param {function} reject
   * @returns {Promise}
   */
    async parseMessage(buffer: ArrayBuffer): Promise<FourWayResponse> {
        const fourWayIf = 0x2E;

        let view = new Uint8Array(buffer);
        if (view[0] !== fourWayIf) {
            const error = `invalid message start: ${view[0]}`;
            throw new Error(error);
        }

        if (view.length < 9) {
            throw new Error('NotEnoughDataError');
        }

        let paramCount = view[4];
        if (paramCount === 0) {
            paramCount = 256;
        }

        if (view.length < 8 + paramCount) {
            let view2 = await this.serialComm.readWithTimeout(8 + paramCount - view.length);
            if (view2 === null) {
                throw new Error('NotEnoughDataError');
            }
            view = new Uint8Array([...view, ...view2]);
        }

        const message: FourWayResponse = {
            command: view[1],
            address: (view[2] << 8) | view[3],
            ack: view[5 + paramCount],
            checksum: (view[6 + paramCount] << 8) | view[7 + paramCount],
            params: view.slice(5, 5 + paramCount)
        };

        const msgWithoutChecksum = view.subarray(0, 6 + paramCount);
        const checksum = msgWithoutChecksum.reduce(this.crc16XmodemUpdate, 0);

        if (checksum !== message.checksum) {
            this.log.error("checksum error");
        }

        // if (checksum !== message.checksum) {
        //     // this.increasePacketErrors(1);

        //     const error = `checksum mismatch, received: ${message.checksum}, calculated: ${checksum}`;
        //     this.logError(error);
        //     throw new Error(error);
        // }

        //this.commandCount--;
        return message;
    }

    async writeAddress(address: number, data: Uint8Array) {
        return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_DeviceWrite, data, address);
    }

    /**
 * Write data to address
 *
 * @param {number} address
 * @param {Array<number>} data
 * @returns {Promise<Response>}
 */
    write(address: number, data: number[] | Uint8Array) {
        // return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_DeviceWrite, Array.from(data), address);
    }

    /**
   * Write data to EEprom address
   *
   * @param {number} address
   * @param {Array<number>} data
   * @returns {Promise<Response>}
   */
    writeEEprom(address: number, data: number[]) {
        // return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_DeviceWriteEEprom, data, address);
    }

    /**
   * Write data to multiple pages up to (but not including) end page
   *
   * @param {number} begin
   * @param {number} end
   * @param {number} pageSize
   * @param {Uint8Array} data
   */
    async writePages(begin: number, end: number, pageSize: number, data: Uint8Array) {
        const beginAddress = begin * pageSize;
        const endAddress = end * pageSize;
        const step = 0x100;

        for (let address = beginAddress; address < endAddress && address < data.length; address += step) {
            await this.write(
                address,
                data.subarray(address, Math.min(address + step, data.length))
            );
        }
    }

    // testAlive () {
    //     return this.sendWithPromise(FOUR_WAY_COMMANDS.cmd_InterfaceTestAlive);
    // }
}