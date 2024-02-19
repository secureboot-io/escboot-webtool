import React, { createContext, useReducer, useContext, useState, FunctionComponent, PropsWithChildren } from "react";
import SerialComm from "./SerialComm";

export type StoreType = {
    serialComm: SerialComm | null;
    setSerialComm: (serialComm: SerialComm | null) => void;
    secure: boolean;
    setSecure: (secure: boolean) => void;
};

const StoreContext = React.createContext<StoreType>({
    serialComm: null, setSerialComm: () => {},
    secure: false, setSecure: () => {},
});

export const StoreProvider = ({ children }: PropsWithChildren<any>) => {
    const [serialComm, setSerialComm] = useState<SerialComm | null>(null);
    const [secure, setSecure] = useState<boolean>(false);

    return <StoreContext.Provider value={{ 
        serialComm, setSerialComm,
        secure, setSecure
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