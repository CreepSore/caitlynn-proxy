import ICaitlynn from "./ICaitlynn";
import IDataChannel from "./IDataChannel";
import IDataProcessor from "./IDataProcessor";

export default interface ICaitlynnBuilder<
    InIncomingProcessorType = any, InOutgoingProcessorType = any,
    OutIncomingProcessorType = Buffer, OutOutgoingProcessorType = Buffer
> {
    setIncomingChannel(channel: IDataChannel): this;
    setOutgoingChannel(channel: IDataChannel): this;

    addIncomingLayer<T, T2>(layer: IDataProcessor<T, T2>): ICaitlynnBuilder<T, T2, OutIncomingProcessorType, OutOutgoingProcessorType>;
    addOutgoingLayer<T, T2>(layer: IDataProcessor<T, T2>): ICaitlynnBuilder<InIncomingProcessorType, InOutgoingProcessorType, T, T2>;

    setIncomingCustomLogic(callback: (packet: InIncomingProcessorType) => InIncomingProcessorType): this;
    setOutgoingCustomLogic(callback: (packet: InOutgoingProcessorType) => InOutgoingProcessorType): this;

    done(): ICaitlynn;
}
