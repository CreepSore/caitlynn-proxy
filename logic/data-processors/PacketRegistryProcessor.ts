import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";

export default class PacketRegistryProcessor<T> implements IDataProcessor<T, T> {
    private _packetTypeConverter: (packet: T) => string;
    savedPackets: {type: string, data: T}[] = [];

    constructor(packetTypeConverter: (packet: T) => string) {
        this._packetTypeConverter = packetTypeConverter;
    }

    async levelUp(dataPackets: T[]): Promise<T[]> {
        for(const packet of dataPackets) {
            this.savedPackets.push({type: this._packetTypeConverter(packet), data: packet});
        }

        return dataPackets;
    }

    async levelDown(dataPackets: T[]): Promise<T[]> {
        return dataPackets;
    }
}
