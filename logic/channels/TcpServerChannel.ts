import {EventEmitter} from "events";
import * as net from "net";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";

export default class TcpServerChannel implements IDataChannel {
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;
    private _socket: net.Server;
    private _clientSocket: net.Socket;
    private _options: {host: string, port: number};

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    constructor(options: {host: string, port: number}) {
        this._options = options;
    }

    start(): Promise<void> {
        this._socket = net.createServer((socket) => {
            if(this._isEstablished) {
                socket.destroy();
                return;
            }
            this._clientSocket = socket;

            this._isEstablished = true;
            this._emitter.emit("connection-established");

            socket.on("close", () => {
                this._isEstablished = false;
                this._emitter.emit("connection-closed");
            });

            socket.on("data", (data) => {
                this._emitter.emit("data-received", data);
            });
        });
        this._socket.listen(this._options.port, this._options.host);

        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._socket?.close?.();

        return Promise.resolve();
    }

    send(data: Buffer): Promise<void> {
        this._clientSocket.write(data);

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
