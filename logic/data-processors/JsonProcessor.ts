import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";

export default class JsonProcessor implements IDataProcessor<string, any> {
    async levelUp(dataPackets: string[]): Promise<any[]> {
        return dataPackets.map((dataPacket) => {
            try {
                return JSON.parse(dataPacket);
            }
            catch {
                return null;
            }
        }).filter(Boolean);
    }

    async levelDown(dataPackets: any[]): Promise<string[]> {
        return dataPackets.map(() => JSON.stringify(dataPackets));
    }
}
