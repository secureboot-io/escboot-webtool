import React, { createContext, useReducer, useContext, useState, FunctionComponent, PropsWithChildren } from "react";
import SerialComm from "./SerialComm";
import EscOperations from "./EscOperations";

export type StoreType = {
    escOperations: EscOperations | null;
    setEscOperations: (escOperations: EscOperations | null) => void;
    detectedEsc: boolean[];
    setDetectedEsc: (detectedEsc: boolean[]) => void;
};

const StoreContext = React.createContext<StoreType>({
    escOperations: null, setEscOperations: () => {},
    detectedEsc: [false, false, false, false], setDetectedEsc: () => {}
});

export const StoreProvider = ({ children }: PropsWithChildren<any>) => {
    const [escOperations, setEscOperations] = useState<EscOperations | null>(null);
    const [detectedEsc, setDetectedEsc] = useState([false, false, false, false]);

    return <StoreContext.Provider value={{ 
        escOperations, setEscOperations,
        detectedEsc, setDetectedEsc
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