import {EventEmitter} from "events";
import * as net from "net";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";
import LogBuilder from "@service/logger/LogBuilder";

export default class TcpClientChannel implements IDataChannel {
    private _name: string = "TcpClientChannel";
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;
    private _socket: net.Socket;
    private _options: {host: string, port: number};

    get name(): string {
        return this._name;
    }

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    constructor(options: {host: string, port: number}, name: string = null) {
        this._options = options;
        this._name = name || this._name;
    }

    start(): Promise<void> {
        this._socket = net.connect(this._options.port, this._options.host);

        this._socket.on("connect", () => {
            LogBuilder
                .start()
                .level("INFO")
                .info(`Caitlynn.${this.name}`)
                .line("Channel connected successfully")
                .done();

            this._isEstablished = true;
            this._emitter.emit("connection-established");
        });

        this._socket.on("close", () => {
            LogBuilder
                .start()
                .level("INFO")
                .info(`Caitlynn.${this.name}`)
                .line("Channel closed")
                .done();

            this._isEstablished = false;
            this._emitter.emit("connection-closed");
        });

        this._socket.on("data", (data) => {
            this._emitter.emit("data-received", data);
        });

        this._socket.on("error", (err) => {
            LogBuilder
                .start()
                .level("INFO")
                .info(`Caitlynn.${this.name}`)
                .line("Channel error occured")
                .object("error", err)
                .done();

            this._isEstablished = false;
            this._emitter.emit("connection-closed");
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
