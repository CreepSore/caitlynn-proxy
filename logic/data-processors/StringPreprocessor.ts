import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";

export default class StringPreprocessor implements IDataProcessor<Buffer, string> {
    async levelUp(dataPackets: Buffer[]): Promise<string[]> {
        return dataPackets.map(dp => dp.toString("utf-8"));
    }

    async levelDown(dataPackets: string[]): Promise<Buffer[]> {
        return dataPackets.map(packet => Buffer.from(packet, "utf-8"));
    }
}
