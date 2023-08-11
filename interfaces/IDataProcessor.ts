export default interface IDataProcessor<IncomingDataType, OutgoingDataType> {
    levelUp(dataPackets: Array<IncomingDataType>): Promise<Array<OutgoingDataType>>;
    levelDown(dataPackets: Array<OutgoingDataType>): Promise<Array<IncomingDataType>>;
}
