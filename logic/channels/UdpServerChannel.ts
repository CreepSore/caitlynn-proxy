import {EventEmitter} from "events";
import * as dgram from "dgram";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";
import LogBuilder from "@service/logger/LogBuilder";

export default class UdpClientChannel implements IDataChannel {
    private _name: string = "UdpClientChannel";
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;
    private _socket: dgram.Socket;
    private _options: {host: string, port: number, udpVersion?: dgram.SocketType};
    private _connectedSocket: dgram.RemoteInfo;
    private _sendBuffer: Buffer[] = [];

    get name(): string {
        return this._name;
    }

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    constructor(options: {host: string, port: number, udpVersion?: dgram.SocketType}, name: string = null) {
        this._options = options;
        this._name = name || this._name;
    }

    start(): Promise<void> {
        this._socket = dgram.createSocket(this._options.udpVersion ?? "udp4");

        this._socket.on("message", (data, rinfo) => {
            this._connectedSocket = rinfo;
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

        this._socket.bind(this._options.port, this._options.host);

        if(!this._isEstablished) {
            this._isEstablished = true;
            this._emitter.emit("connection-established");

            LogBuilder
                .start()
                .level("INFO")
                .info(`Caitlynn.${this.name}`)
                .line("Connection established.")
                .done();
        }

        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._socket?.close?.();
        this._connectedSocket = null;
        this._isEstablished = false;
        return Promise.resolve();
    }

    async send(data: Buffer): Promise<void> {
        if(!this._isEstablished || !this._connectedSocket) {
            this._sendBuffer.push(data);
            return;
        }

        for(const packet of this._sendBuffer) {
            this._socket.send(packet, this._connectedSocket.port, this._connectedSocket.address);
        }
        this._sendBuffer = [];

        this._socket.send(data, this._connectedSocket.port, this._connectedSocket.address);
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
