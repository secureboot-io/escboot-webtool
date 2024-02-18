import { LogContextType, LogEntryProps } from "./LogProvider";

export type LogInterface = {
    trace: (str : string) => void;
    debug: (str : string) => void;
    info: (str : string) => void;
    warn: (str : string) => void;
    error: (str : string) => void;
};

export enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export default class Logger implements LogInterface
{


    private static instance : Logger | null = null;

    static init(logContext : LogContextType)
    {
        if(this.instance === null)
        {
            this.instance = new Logger(logContext)
        }
    }

    static getInstance() : Logger
    {
        if(this.instance === null)
        {
            throw new Error("Logger not initialized");
        }
        return this.instance;
    }

    private logContext : LogContextType;
    private logs : LogEntryProps[] = [];

    constructor(logContext : LogContextType) {
        this.logContext = logContext;
        this.info("Logger started");
    }

    log(str : string, level : LogLevel) {
        if(this.logs.length > 0 && this.logs[0].msg === str)
        {
            this.logs[0].count++;
            this.logContext.setLogs([...this.logs]);
        } else {
            this.logs.unshift({time: new Date().toLocaleTimeString(), msg: str, count: 1});
            this.logContext.setLogs([...this.logs]);
        }
    }

    trace(str : string) {
        this.log(str, LogLevel.TRACE);
    }

    debug(str : string) {
        this.log(str, LogLevel.DEBUG);
    }

    info(str : string) {
        this.log(str, LogLevel.INFO);
    }

    warn(str : string) {
        this.log(str, LogLevel.WARN);
    }

    error(str : string) {
        this.log(str, LogLevel.ERROR);
    }
}