import ICaitlynn from "./ICaitlynn";
import IDataChannel from "./IDataChannel";

export default interface ICaitlynnManager {
    get isStarted(): boolean;

    start(caitlynn: ICaitlynn): Promise<void>;
    stop(): Promise<void>;

    handleIncomingConnectionEstablished(
        channel: IDataChannel,
    ): Promise<void>;

    handleOutgoingConnectionEstablished(
        channel: IDataChannel,
    ): Promise<void>;

    handleIncomingConnectionClosed(
        channel: IDataChannel,
    ): Promise<void>;

    handleOutgoingConnectionClosed(
        channel: IDataChannel,
    ): Promise<void>;

    handleIncomingRawDataReceived(
        data: Buffer,
        channel: IDataChannel
    ): Promise<Buffer>;

    handleOutgoingRawDataReceived(
        data: Buffer,
        channel: IDataChannel,
    ): Promise<Buffer>;

    /** Gets executed before any custom logic right after layer parsing */
    preprocessIncomingParsedDataReceived<T>(
        data: T[],
        channel: IDataChannel,
    ): Promise<T[]>;

    /** Gets executed before any custom logic right after layer parsing */
    preprocessOutgoingParsedDataReceived<T>(
        data: T[],
        channel: IDataChannel,
    ): Promise<T[]>;

    /** Gets executed after any custom logic right before layering down */
    postprocessIncomingParsedDataReceived<T>(
        data: T[],
        channel: IDataChannel,
    ): Promise<T[]>;

    /** Gets executed after any custom logic right before layering down */
    postprocessOutgoingParsedDataReceived<T>(
        data: T[],
        channel: IDataChannel,
    ): Promise<T[]>;
}
