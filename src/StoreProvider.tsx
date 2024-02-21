import React, { createContext, useReducer, useContext, useState, FunctionComponent, PropsWithChildren } from "react";
import SerialComm from "./SerialComm";
import EscOperations from "./EscOperations";
import { DeviceInfo } from "./FourWay";

export type EscInfo = {
    secure: boolean;
    deviceInfo: DeviceInfo;
}

export type CommonEscInfo = {
    secure: boolean;
    manufacturerId: string;
    manufacturerPublicKey: string;
}

export type StoreType = {
    escOperations: EscOperations | null;
    setEscOperations: (escOperations: EscOperations | null) => void;
    escInfos: (EscInfo |null)[];
    setEscInfos: (escInfos: (EscInfo |null)[]) => void;
    commonEscInfo: CommonEscInfo | null;
    setCommonEscInfo: (commonEscInfo: CommonEscInfo | null) => void;
};

const StoreContext = React.createContext<StoreType>({
    escOperations: null, setEscOperations: () => {},
    escInfos: [], setEscInfos: () => {},
    commonEscInfo: null, setCommonEscInfo: () => {}
});

export const StoreProvider = ({ children }: PropsWithChildren<any>) => {
    const [escOperations, setEscOperations] = useState<EscOperations | null>(null);
    const [escInfos, setEscInfos] = useState<(EscInfo | null)[]>([]);
    const [commonEscInfo, setCommonEscInfo] = useState<CommonEscInfo | null>(null);

    return <StoreContext.Provider value={{ 
        escOperations, setEscOperations,
        escInfos, setEscInfos,
        commonEscInfo, setCommonEscInfo
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