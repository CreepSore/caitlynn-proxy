import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";
import LogBuilder from "@service/logger/LogBuilder";

export default class StringPreprocessor implements IDataProcessor<Buffer, string> {
    async levelUp(dataPackets: Buffer[]): Promise<string[]> {
        if(dataPackets.length !== 1) {
            LogBuilder
                .start()
                .level("ERROR")
                .info("StringPreprocessor")
                .line(`Got invalid input: Expected 1 packet, got ${dataPackets.length}`)
                .done();

            return null;
        }

        return [dataPackets[0].toString("utf-8")];
    }

    async levelDown(dataPackets: string[]): Promise<Buffer[]> {
        return dataPackets.map(packet => Buffer.from(packet, "utf-8"));
    }
}
