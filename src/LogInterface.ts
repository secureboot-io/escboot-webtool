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