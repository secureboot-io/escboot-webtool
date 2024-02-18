import { Badge, Chip, ScrollShadow } from "@nextui-org/react";
import React, { createContext, forwardRef, useContext, useEffect, useImperativeHandle } from "react";
import { Component, FC, useState } from "react";
import { useLog } from "./LogProvider";

const Log : FC = () => {
        
    const {logs, setLogs} = useLog();

    // setLogs([{
    //     time: new Date().toLocaleTimeString(),
    //     msg: "Log started",
    //     count: 1
    // }]);

    //use
    // useEffect(() => {
    //     console.log("Log updated");
    // }, [logs]);

    return (
    <ScrollShadow  className="h-[300px] pl-0">
        {logs.map((log, i) => (
            <div className="text-sm" key={i}><Chip radius="none" className="ml-0 mr-2">{log.time}</Chip> {log.msg} 
            {
                log.count > 1 && <Chip className="mx-2">{log.count}</Chip>
            }
            </div>
        ))}
    </ScrollShadow>);
};

export default Log;