import * as net from "net";

import ICaitlynn from "@extensions/Caitlynn.Core/interfaces/ICaitlynn";
import ICaitlynnManager from "@extensions/Caitlynn.Core/interfaces/ICaitlynnManager";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";

export default class TcpServerManager implements ICaitlynnManager {
    readonly newline: string = "\r\n";
    private _isStarted: boolean = false;
    private _caitlynn: ICaitlynn;
    private _config: {host: string, port: number};
    private _socket: net.Server;
    private _connectedClient: net.Socket;
    private _sendReceivedDataString: boolean = false;
    private _sendReceivedBufferString: boolean = false;
    private _buffer: string = "";

    get isStarted(): boolean {
        return this._isStarted;
    }

    constructor(config: {host: string, port: number}) {
        this._config = config;
    }

    async start(caitlynn: ICaitlynn): Promise<void> {
        this._caitlynn = caitlynn;

        this._socket = net.createServer();
        this._socket.on("connection", (socket) => {
            if(this._connectedClient) {
                this._connectedClient.removeAllListeners();
                this._connectedClient.destroy();
            }

            this._connectedClient = socket;

            this._connectedClient.on("data", (data) => {
                this._buffer += data.toString("utf-8");
                this.processBuffer();
            });

            this._connectedClient.on("close", () => {
                this._connectedClient = null;
            });

            this._connectedClient.on("error", (err) => {
                this._connectedClient.destroy();
                this._connectedClient = null;
            });

            this.sendString("Caitlynn Proxy");
        });

        this._socket.listen(this._config.port, this._config.host);
    }

    async stop(): Promise<void> {
        this._socket?.close?.();
    }

    async handleIncomingConnectionEstablished(channel: IDataChannel): Promise<void> {
        this.sendString("Incoming Channel connected");
    }

    async handleOutgoingConnectionEstablished(channel: IDataChannel): Promise<void> {
        this.sendString("Outgoing Channel connected");
    }

    async handleIncomingConnectionClosed(channel: IDataChannel): Promise<void> {
        this.sendString("Incoming Channel closed");
    }

    async handleOutgoingConnectionClosed(channel: IDataChannel): Promise<void> {
        this.sendString("Outgoing Channel closed");
    }

    async handleIncomingRawDataReceived(data: Buffer, channel: IDataChannel): Promise<Buffer> {
        if(this._sendReceivedDataString) {
            this.sendString(`CLIENT -> SERVER: <${data.toString()}>`);
        }

        if(this._sendReceivedBufferString) {
            this.sendString(`CLIENT -> SERVER: <${data.toString("hex").toUpperCase().match(/.{1,2}/g).join(" ")}>`);
        }

        return data;
    }

    async handleOutgoingRawDataReceived(data: Buffer, channel: IDataChannel): Promise<Buffer> {
        if(this._sendReceivedDataString) {
            this.sendString(`SERVER -> CLIENT: <${data.toString()}>`);
        }

        if(this._sendReceivedBufferString) {
            this.sendString(`SERVER -> CLIENT: <${data.toString("hex").toUpperCase().match(/.{1,2}/g).join(" ")}>`);
        }

        return data;
    }

    async preprocessIncomingParsedDataReceived<T>(data: T[], channel: IDataChannel): Promise<T[]> {
        return data;
    }

    async preprocessOutgoingParsedDataReceived<T>(data: T[], channel: IDataChannel): Promise<T[]> {
        return data;
    }

    async postprocessIncomingParsedDataReceived<T>(data: T[], channel: IDataChannel): Promise<T[]> {
        return data;
    }

    async postprocessOutgoingParsedDataReceived<T>(data: T[], channel: IDataChannel): Promise<T[]> {
        return data;
    }

    private processCommand(command: string, args: string[]): void {
        if(command === "help") {
            this.sendString(
                "Commands:" + this.newline +
                "help - Displays this help message" + this.newline +
                "datastring - Toggles sending of data as string" + this.newline +
                "bufferstring - Toggles sending of data as hex string" + this.newline +
                "send <'in'|'out'> <'hex'|'string'> <data> - Sends data to the specified channel" + this.newline,
            );
            return;
        }

        if(command === "datastring") {
            this._sendReceivedDataString = !this._sendReceivedDataString;
            this.sendString("Data string sending " + (this._sendReceivedDataString ? "enabled" : "disabled"));
            return;
        }

        if(command === "bufferstring") {
            this._sendReceivedBufferString = !this._sendReceivedBufferString;
            this.sendString("Buffer string sending " + (this._sendReceivedBufferString ? "enabled" : "disabled"));
            return;
        }

        if(command === "send") {
            const direction = args[0];
            const type = args[1];
            const data = args.slice(2).join("");

            if(!data) {
                this.sendString("No data specified");
                return;
            }

            if(!direction) {
                this.sendString("No direction specified");
                return;
            }

            if(!type) {
                this.sendString("No type specified");
                return;
            }

            if(direction !== "in" && direction !== "out") {
                this.sendString("Invalid direction specified");
                return;
            }

            if(type !== "string" && type !== "hex") {
                this.sendString("Invalid type specified");
                return;
            }

            const channel = direction === "in" ? this._caitlynn.incomingChannel : this._caitlynn.outgoingChannel;

            if(!channel.isEstablished) {
                this.sendString("Channel is not connected.");
                return;
            }

            if(!channel) {
                this.sendString("Channel not connected");
                return;
            }

            if(type === "string") {
                channel.send(Buffer.from(data, "utf-8"));
                this.sendString(`${direction === "in" ? "PROXY -> CLIENT" : "PROXY -> SERVER"}: <${data}>`);
                return;
            }

            if(type === "hex") {
                const toSend = Buffer.from(data.replace(" ", ""), "hex");
                channel.send(toSend);
                this.sendString(`${direction === "in" ? "PROXY -> CLIENT" : "PROXY -> SERVER"}: <${toSend.toString("hex").replace(" ", "").toUpperCase().match(/.{1,2}/g).join(" ")}>`);
                return;
            }
        }

        if(command === "clear") {
            this.sendString("\x1Bc");
            return;
        }
    }

    private processCommandLine(command: string): void {
        const args = command.split(" ");
        const commandName = args.shift();

        if(!commandName) {
            return;
        }

        this.processCommand(commandName, args);
    }

    private processBuffer(): void {
        let buffer = this._buffer;
        let newlineIndex = buffer.indexOf(this.newline);

        while(newlineIndex !== -1) {
            const command = buffer.substring(0, newlineIndex);
            this._buffer = buffer = buffer.substring(newlineIndex + this.newline.length);

            this.processCommandLine(command);
            newlineIndex = buffer.indexOf(this.newline);
        }
    }

    private sendString(data: string): void {
        if(this._connectedClient) {
            this._connectedClient.write(data + this.newline);
        }
    }
}
