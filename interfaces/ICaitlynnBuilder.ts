import ICaitlynn from "./ICaitlynn";
import IDataChannel from "./IDataChannel";
import IDataProcessor from "./IDataProcessor";

export default interface ICaitlynnBuilder<
    InIncomingProcessorType = any, InOutgoingProcessorType = any,
    OutIncomingProcessorType = Buffer, OutOutgoingProcessorType = Buffer
> {
    incomingChannel(channel: IDataChannel): this;
    outgoingChannel(channel: IDataChannel): this;

    incomingLayer<T, T2>(layer: IDataProcessor<T, T2>): ICaitlynnBuilder<T, T2, OutIncomingProcessorType, OutOutgoingProcessorType>;
    outgoingLayer<T, T2>(layer: IDataProcessor<T, T2>): ICaitlynnBuilder<InIncomingProcessorType, InOutgoingProcessorType, T, T2>;

    incomingLogic(callback: (packet: InIncomingProcessorType) => InIncomingProcessorType): this;
    outgoingLogic(callback: (packet: InOutgoingProcessorType) => InOutgoingProcessorType): this;

    done(): ICaitlynn;
}
