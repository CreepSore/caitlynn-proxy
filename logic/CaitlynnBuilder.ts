import ICaitlynn from "../interfaces/ICaitlynn";
import ICaitlynnBuilder from "../interfaces/ICaitlynnBuilder";
import IDataChannel from "../interfaces/IDataChannel";
import IDataProcessor from "../interfaces/IDataProcessor";
import Caitlynn from "./Caitlynn";

export default class CaitlynnBuilder<
    InIncomingProcessorType = Buffer, InOutgoingProcessorType = Buffer,
    OutIncomingProcessorType = Buffer, OutOutgoingProcessorType = Buffer
> implements ICaitlynnBuilder<InIncomingProcessorType, InOutgoingProcessorType> {
    private _incomingChannel: IDataChannel;
    private _outgoingChannel: IDataChannel;
    private _incomingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _outgoingProcessingLayers: IDataProcessor<any, any>[] = [];
    private _incomingCustomLogic: (packet: InIncomingProcessorType) => InIncomingProcessorType;
    private _outgoingCustomLogic: (packet: InOutgoingProcessorType) => InOutgoingProcessorType;

    setIncomingChannel(channel: IDataChannel): this {
        this._incomingChannel = channel;
        return this;
    }

    setOutgoingChannel(channel: IDataChannel): this {
        this._outgoingChannel = channel;
        return this;
    }

    /**
     * Incoming:
     * [client] -> [proxy] -> [server]
     */
    addIncomingLayer<T, T2>(layer: IDataProcessor<T, T2>): CaitlynnBuilder<T, T2, OutIncomingProcessorType, OutOutgoingProcessorType> {
        this._incomingProcessingLayers.push(layer);
        return this as unknown as CaitlynnBuilder<T, T2, OutIncomingProcessorType, OutOutgoingProcessorType>;
    }

    /**
     * Outgoing:
     * [client] <- [proxy] <- [server]
     */
    addOutgoingLayer<T, T2>(layer: IDataProcessor<T, T2>): CaitlynnBuilder<InIncomingProcessorType, InOutgoingProcessorType, T, T2> {
        this._outgoingProcessingLayers.push(layer);
        return this as unknown as CaitlynnBuilder<InIncomingProcessorType, InOutgoingProcessorType, T, T2>;
    }

    setIncomingCustomLogic(callback: (packet: InIncomingProcessorType) => InIncomingProcessorType): this {
        this._incomingCustomLogic = callback;
        return this;
    }

    setOutgoingCustomLogic(callback: (packet: InOutgoingProcessorType) => InOutgoingProcessorType): this {
        this._outgoingCustomLogic = callback;
        return this;
    }

    done(): ICaitlynn {
        return new Caitlynn({
            incomingChannel: this._incomingChannel,
            outgoingChannel: this._outgoingChannel,
        }, {
            incomingProcessingLayers: this._incomingProcessingLayers,
            outgoingProcessingLayers: this._outgoingProcessingLayers,
        }, {
            incoming: this._incomingCustomLogic,
            outgoing: this._outgoingCustomLogic,
        });
    }
}
