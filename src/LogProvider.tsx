import { logRoles } from "@testing-library/react";
import React, { createContext, useReducer, useContext, useState, FunctionComponent, PropsWithChildren } from "react";
import { LogInterface, LogLevel } from "./LogInterface";

export interface LogEntryProps {
    time: string;
    msg: string;
    count: number;
}

export type LogContextType = {
    logs: LogEntryProps[];
    setLogs: (log: LogEntryProps[]) => void;
};

const LogContext = React.createContext<LogContextType>({logs: [], setLogs: () => {}});

export const LogProvider = ({ children }: PropsWithChildren<any>) => {
    const [logs, setLogs] = useState<LogEntryProps[]>([]);

    return <LogContext.Provider value={{ logs, setLogs}}>
        {children}
    </LogContext.Provider>;
}

export const useLog = () => {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error("useLog must be used within a LogProvider");
    }
    return context;
}

export default LogProvider;