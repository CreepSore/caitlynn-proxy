import LogBuilder from "@service/logger/LogBuilder";
import ICaitlynn from "../interfaces/ICaitlynn";
import IDataChannel from "../interfaces/IDataChannel";
import IDataProcessor from "../interfaces/IDataProcessor";
import ICaitlynnManager from "../interfaces/ICaitlynnManager";

export default class Caitlynn implements ICaitlynn {
    private _isRunning: boolean = false;
    private _isReady: boolean = false;
    private _incomingChannel: IDataChannel;
    private _outgoingChannel: IDataChannel;
    private _incomingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _outgoingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _incomingCustomLogic: (packet: any) => any;
    private _outgoingCustomLogic: (packet: any) => any;
    private _managers: ICaitlynnManager[] = [];

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

    get managers(): ICaitlynnManager[] {
        return [...this._managers];
    }

    constructor(
        channels: {incomingChannel: IDataChannel, outgoingChannel: IDataChannel},
        processingLayers: {incomingProcessingLayers: IDataProcessor<any, any>[], outgoingProcessingLayers: IDataProcessor<any, any>[]},
        customLogic: {incoming: (packet: any) => any, outgoing: (packet: any) => any},
        managers: ICaitlynnManager[],
    ) {
        this._incomingChannel = channels.incomingChannel;
        this._outgoingChannel = channels.outgoingChannel;
        this._incomingProcessingLayers = processingLayers.incomingProcessingLayers;
        this._outgoingProcessingLayers = processingLayers.outgoingProcessingLayers;
        this._incomingCustomLogic = customLogic.incoming;
        this._outgoingCustomLogic = customLogic.outgoing;
        this._managers = managers;
    }

    async start(): Promise<void> {
        this._isRunning = true;
        this._incomingChannel.onConnectionEstablished(() => this.onConnectionEstablished(this._incomingChannel, "in"));
        this._outgoingChannel.onConnectionEstablished(() => this.onConnectionEstablished(this._outgoingChannel, "out"));

        this._incomingChannel.onConnectionClosed(() => this.onConnectionClosed(this._incomingChannel, "in"));
        this._outgoingChannel.onConnectionClosed(() => this.onConnectionClosed(this._outgoingChannel, "out"));

        this._incomingChannel.onDataReceived((data) => this.onDataReceived(this._incomingChannel, "in", data));
        this._outgoingChannel.onDataReceived((data) => this.onDataReceived(this._outgoingChannel, "out", data));

        for(const manager of this._managers) {
            await manager.start(this);
        }

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

        for(const manager of this._managers) {
            await manager.stop();
        }

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
        const reverseLayers = [...layers].reverse();
        const customLogic = direction === "in" ? this._incomingCustomLogic : this._outgoingCustomLogic;
        let dataToProcess = data;

        for(const manager of this._managers) {
            if(direction === "in") {
                dataToProcess = await manager.handleIncomingRawDataReceived(data, channel);
            }
            else {
                dataToProcess = await manager.handleOutgoingRawDataReceived(data, channel);
            }
        }

        let currentData: any[] = [dataToProcess];
        for(const layer of layers) {
            currentData = await layer.levelUp(currentData);
            if(!currentData) return;
        }

        for(const manager of this._managers) {
            if(direction === "in") {
                currentData = await manager.preprocessIncomingParsedDataReceived(currentData, channel);
            }
            else {
                currentData = await manager.preprocessOutgoingParsedDataReceived(currentData, channel);
            }
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

        for(const manager of this._managers) {
            if(direction === "in") {
                currentData = await manager.postprocessIncomingParsedDataReceived(currentData, channel);
            }
            else {
                currentData = await manager.postprocessOutgoingParsedDataReceived(currentData, channel);
            }
        }

        for(const layer of reverseLayers) {
            currentData = await layer.levelDown(currentData);
            if(!currentData) return;
        }

        for(const packet of currentData) {
            await target.send(packet);
        }
    }

    private async onConnectionEstablished(channel: IDataChannel, direction: "in"|"out"): Promise<void> {
        await this.onConnectionStateChanged(channel, direction);

        for(const manager of this._managers) {
            if(direction === "in") {
                await manager.handleIncomingConnectionEstablished(channel);
            }
            else {
                await manager.handleOutgoingConnectionEstablished(channel);
            }
        }

        if(this._incomingChannel.isEstablished && !this._outgoingChannel.isEstablished) {
            await this._outgoingChannel.start();
        }
    }

    private async onConnectionClosed(channel: IDataChannel, direction: "in"|"out"): Promise<void> {
        await this.onConnectionStateChanged(channel, direction);

        for(const manager of this._managers) {
            if(direction === "in") {
                await manager.handleIncomingConnectionClosed(channel);
            }
            else {
                await manager.handleOutgoingConnectionClosed(channel);
            }
        }

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
