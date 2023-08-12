import IDataChannel from "./IDataChannel";
import IDataProcessor from "./IDataProcessor";
import ICaitlynnManager from "./ICaitlynnManager";

export default interface ICaitlynn {
    get isRunning(): boolean;
    get isReady(): boolean;

    get incomingChannel(): IDataChannel;
    get outgoingChannel(): IDataChannel;

    get incomingProcessingLayers(): IDataProcessor<any, any>[];
    get outgoingProcessingLayers(): IDataProcessor<any, any>[];

    get managers(): ICaitlynnManager[];

    start(): Promise<void>;
    stop(): Promise<void>;
}
