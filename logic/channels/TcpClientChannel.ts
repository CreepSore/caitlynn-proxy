import {EventEmitter} from "events";
import * as net from "net";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";

export default class TcpServerChannel implements IDataChannel {
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;
    private _socket: net.Socket;
    private _options: {host: string, port: number};

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    constructor(options: {host: string, port: number}) {
        this._options = options;
    }

    start(): Promise<void> {
        this._socket = net.connect(this._options.port, this._options.host);

        this._socket.on("connect", () => {
            this._isEstablished = true;
            this._emitter.emit("connection-established");
        });

        this._socket.on("close", () => {
            this._isEstablished = false;
            this._emitter.emit("connection-closed");
        });

        this._socket.on("data", (data) => {
            this._emitter.emit("data-received", data);
        });
        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._socket?.destroy?.();
        return Promise.resolve();
    }

    send(data: Buffer): Promise<void> {
        this._socket.write(data);
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
