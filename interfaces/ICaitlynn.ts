import IDataChannel from "./IDataChannel";
import IDataProcessor from "./IDataProcessor";

export default interface ICaitlynn {
    get isRunning(): boolean;
    get isReady(): boolean;

    get incomingChannel(): IDataChannel;
    get outgoingChannel(): IDataChannel;

    get incomingProcessingLayers(): IDataProcessor<any, any>[];
    get outgoingProcessingLayers(): IDataProcessor<any, any>[];

    start(): Promise<void>;
    stop(): Promise<void>;
}
