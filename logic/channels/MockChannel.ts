import {EventEmitter} from "events";
import IDataChannel from "@extensions/Caitlynn.Core/interfaces/IDataChannel";

export default class MockChannel implements IDataChannel {
    private _name: string = "MockChannel";
    private _emitter: EventEmitter = new EventEmitter();
    private _isEstablished: boolean = false;
    private _answers: {regex: RegExp, toSend: string}[] = [];
    private _firstMessage: Buffer;

    get name(): string {
        return this._name;
    }

    get isEstablished(): boolean {
        return this._isEstablished;
    }

    constructor(answers: {regex: RegExp, toSend: string}[], firstMessage: string|Buffer = "", name: string = null) {
        this._name = name || this._name;
        this._answers = answers;
        this._firstMessage = typeof firstMessage === "string" ? Buffer.from(firstMessage) : firstMessage;
    }

    start(): Promise<void> {
        this._isEstablished = true;
        this._emitter.emit("connection-established");

        this._emitter.emit("data-received", this._firstMessage);

        return Promise.resolve();
    }

    stop(): Promise<void> {
        this._isEstablished = false;
        this._emitter.emit("connection-closed");

        return Promise.resolve();
    }

    send(data: Buffer): Promise<void> {
        for(const answer of this._answers) {
            if(answer.regex.test(data.toString())) {
                this._emitter.emit("data-received", Buffer.from(answer.toSend));
                return Promise.resolve();
            }
        }

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
