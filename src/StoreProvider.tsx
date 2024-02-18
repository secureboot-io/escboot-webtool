import React, { createContext, useReducer, useContext, useState, FunctionComponent, PropsWithChildren } from "react";

export type StoreType = {
    serial: Serial | null;
    setSerial: (serial: Serial) => void;
    secure: boolean;
    setSecure: (secure: boolean) => void;
    ports: SerialPort[];
    setPorts: (ports: SerialPort[]) => void;
    selectedPort: number;
    setSelectedPort: (port: number) => void;
};

const StoreContext = React.createContext<StoreType>({
    serial: null, setSerial: () => {},
    secure: false, setSecure: () => {},
    ports: [], setPorts: () => {},
    selectedPort: -1, setSelectedPort: () => {}
});

export const StoreProvider = ({ children }: PropsWithChildren<any>) => {
    const [serial, setSerial] = useState<Serial | null>(null);
    const [secure, setSecure] = useState<boolean>(false);
    const [ports, setPorts] = useState<SerialPort[]>([]);
    const [selectedPort, setSelectedPort] = useState<number>(-1);

    return <StoreContext.Provider value={{ 
        serial, setSerial,
        secure, setSecure,
        ports, setPorts,
        selectedPort, setSelectedPort
    }}>
        {children}
    </StoreContext.Provider>;
}

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useLog must be used within a LogProvider");
    }
    return context;
}

export default StoreProvider;