import Log from "./Log";
import { LogInterface } from "./LogInterface";
import Logger from "./Logger";

class SerialComm
{
    private port: SerialPort;
    private log : LogInterface;
    private isOpen : boolean = false;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null;
    /**
     * 
     * @returns 
     */
    static async getPorts()
    {
        return await navigator.serial.getPorts();
    }

    /**
     * 
     * @returns 
     */
    static async requestPorts()
    {
        await navigator.serial.requestPort();
        return await navigator.serial.getPorts();
    }

    /**
     * 
     * @param serialPort 
     * @returns 
     */
    async connect(baudRate = 115200)
    {
        try
        {
            if(this.isPortOpen()) {
                return;
            }
            await this.port.open({baudRate: baudRate})
            this.isOpen = true;
        }
        catch (e)
        {
            console.error(e);
        }
        return null;
    }

    /**
     * 
     * @returns 
     */
    static isSerialSupported() : boolean
    {
        return 'serial' in navigator;
    }

    /**
     * 
     * @param port 
     */
    static forgetPort(port : SerialPort)
    {
        port.forget();
    }

    /**
     * 
     * @param serialPort 
     * @param log 
     */
    constructor(serialPort : SerialPort)
    {
        this.port = serialPort;
        this.reader = null;
        this.log = Logger.getInstance();
    }

    /**
     * 
     * @param data 
     * @returns 
     */
    async write(data: Uint8Array)
    {
        if (!this.isOpen) {
            throw new Error('Serial not initiated!');
        }
        const writter = this.port.writable?.getWriter();
        let chunk = writter?.write(data);
        writter?.releaseLock();
        //log
        this.log.info("Sent: " + this.toHexString(data));
        return chunk;
    }

    private toHexString(byteArray : Uint8Array) {
        return Array.from(byteArray, function(byte) {
          return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join(' ')
      }

    public async readWithTimeout(min : number, ms = 100): Promise<Uint8Array> {
        if (!this.isOpen) {
            throw new Error('Serial not initiated!');
        }
        if (this.port.readable === null) {
            throw new Error('Serial not initiated!');
        }
        this.reader = this.port.readable.getReader();
        const timer = setTimeout(() => {
            this.reader?.releaseLock();
            this.reader = null;
        }, ms);
        let result = 0;
        let bufs = [];
        try {
            do {
                const { value, done } = await this.reader.read();
                if(value === undefined || done) {
                    break;
                }
                min -= value.byteLength;
                result += value.byteLength;
                bufs.push(value);
            } while (min > 0);
        } catch(e) {
            console.log(e);
        }
        clearTimeout(timer);
        this.reader?.releaseLock();
        this.reader = null;

        // Get the total length of all arrays.
        let length = 0;
        bufs.forEach(item => {
            length += item.length;
        });

        // Create a new array with total length and merge all source arrays.
        let mergedArray = new Uint8Array(length);
        let offset = 0;
        bufs.forEach(item => {
            mergedArray.set(item, offset);
            offset += item.length;
        });

        //log
        this.log.info("Received: " + this.toHexString(mergedArray));

        return mergedArray;
    }

    async disconnect()
    {
        if (this.reader)
        {
            await this.reader.cancel();
            await this.reader.releaseLock();
        }
        await this.port.close();
        this.reader = null;
        this.isOpen = false;
    }

    isPortOpen()
    {
        return this.isOpen;
    }
}

export default SerialComm;