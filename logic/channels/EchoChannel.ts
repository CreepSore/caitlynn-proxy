import {EventEmitter} from "events";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";
import LogBuilder from "@service/logger/LogBuilder";

export default class EchoChannel implements IDataChannel {
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    start(): Promise<void> {
        this._isEstablished = true;
        this._emitter.emit("connection-established");

        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._isEstablished = false;
        this._emitter.emit("connection-closed");

        return Promise.resolve();
    }

    send(data: Buffer): Promise<void> {
        LogBuilder
            .start()
            .level("INFO")
            .info("EchoChannel")
            .line(`Data Transfer: ${data.toString("utf-8")}`)
            .done();

        this._emitter.emit("data-received", data);

        return Promise.resolve();
    }

    onDataReceived(callback: (data: Buffer) => void): void {
        this._emitter.on("data-received", callback);
    }

    onConnectionEstablished(callback: () => void): void {
        this._emitter.on("connection-established", callback);
    }

    onConnectionClosed(callback: () => void): void {
        this._emitter.on("connection-closed", callback);
    }
}
