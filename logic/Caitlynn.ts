import LogBuilder from "@service/logger/LogBuilder";
import ICaitlynn from "../interfaces/ICaitlynn";
import IDataChannel from "../interfaces/IDataChannel";
import IDataProcessor from "../interfaces/IDataProcessor";

export default class Caitlynn implements ICaitlynn {
    private _isRunning: boolean = false;
    private _isReady: boolean = false;
    private _incomingChannel: IDataChannel;
    private _outgoingChannel: IDataChannel;
    private _incomingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _outgoingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _incomingCustomLogic: (packet: any) => any;
    private _outgoingCustomLogic: (packet: any) => any;

    get isRunning(): boolean {
        return this._isRunning;
    }

    get isReady(): boolean {
        return this._isReady;
    }

    get incomingChannel(): IDataChannel {
        return this._incomingChannel;
    }

    get outgoingChannel(): IDataChannel {
        return this._outgoingChannel;
    }

    get incomingProcessingLayers(): IDataProcessor<any, any>[] {
        return [...this._incomingProcessingLayers];
    }

    get outgoingProcessingLayers(): IDataProcessor<any, any>[] {
        return [...this._outgoingProcessingLayers];
    }

    constructor(
        channels: {incomingChannel: IDataChannel, outgoingChannel: IDataChannel},
        processingLayers: {incomingProcessingLayers: IDataProcessor<any, any>[], outgoingProcessingLayers: IDataProcessor<any, any>[]},
        customLogic: {incoming: (packet: any) => any, outgoing: (packet: any) => any},
    ) {
        this._incomingChannel = channels.incomingChannel;
        this._outgoingChannel = channels.outgoingChannel;
        this._incomingProcessingLayers = processingLayers.incomingProcessingLayers;
        this._outgoingProcessingLayers = processingLayers.outgoingProcessingLayers;
        this._incomingCustomLogic = customLogic.incoming;
        this._outgoingCustomLogic = customLogic.outgoing;
    }

    async start(): Promise<void> {
        this._isRunning = true;
        this._incomingChannel.onConnectionEstablished(() => this.onConnectionEstablished(this._incomingChannel, "in"));
        this._outgoingChannel.onConnectionEstablished(() => this.onConnectionEstablished(this._outgoingChannel, "out"));

        this._incomingChannel.onConnectionClosed(() => this.onConnectionClosed(this._incomingChannel, "in"));
        this._outgoingChannel.onConnectionClosed(() => this.onConnectionClosed(this._outgoingChannel, "out"));

        this._incomingChannel.onDataReceived((data) => this.onDataReceived(this._incomingChannel, "in", data));
        this._outgoingChannel.onDataReceived((data) => this.onDataReceived(this._outgoingChannel, "out", data));

        await this._incomingChannel.start();

        LogBuilder
            .start()
            .level("INFO")
            .info("Caitlynn")
            .line("Caitlynn startup successful.")
            .done();
    }

    async stop(): Promise<void> {
        this._isRunning = false;
        // TODO: Nicer error handling
        await this._incomingChannel.stop().catch(() => {});
        await this._outgoingChannel.stop().catch(() => {});
    }

    async reset(): Promise<void> {
        await this._incomingChannel.start();
    }

    private async onDataReceived(channel: IDataChannel, direction: "in"|"out", data: Buffer): Promise<void> {
        const target = direction === "in" ? this._outgoingChannel : this._incomingChannel;
        const layers = direction === "in" ? this._incomingProcessingLayers : this._outgoingProcessingLayers;
        const customLogic = direction === "in" ? this._incomingCustomLogic : this._outgoingCustomLogic;

        let currentData: any = [data];
        for(const layer of layers) {
            currentData = await layer.levelUp(currentData);
            if(!currentData) return;
        }

        const processedData: any = [];
        for(const packet of currentData) {
            if(customLogic) {
                processedData.push(customLogic?.(packet));
            }
            else {
                processedData.push(packet);
            }
        }
        currentData = processedData.filter(Boolean);

        for(const layer of layers) {
            currentData = await layer.levelDown(currentData);
            if(!currentData) return;
        }

        for(const packet of currentData) {
            await target.send(packet);
        }
    }

    private async onConnectionEstablished(channel: IDataChannel, direction: "in"|"out"): Promise<void> {
        await this.onConnectionStateChanged(channel, direction);

        if(this._incomingChannel.isEstablished && !this._outgoingChannel.isEstablished) {
            await this._outgoingChannel.start();
        }
    }

    private async onConnectionClosed(channel: IDataChannel, direction: "in"|"out"): Promise<void> {
        await this.onConnectionStateChanged(channel, direction);

        // TODO: Nicer error handling
        await this._incomingChannel.stop().catch(() => {});
        await this._outgoingChannel.stop().catch(() => {});
        if(this.isRunning) {
            await this.reset();
        }
        else {
            this.stop();
        }
    }

    private async onConnectionStateChanged(channel: IDataChannel, direction: "in"|"out"): Promise<void> {
        this._isReady = this._incomingChannel.isEstablished && this._outgoingChannel.isEstablished;
    }
}
