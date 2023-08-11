import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";

export default class PacketConstructorProcessor implements IDataProcessor<string, string> {
    private _packetBuilderBuffer: string = "";
    private _processorCallback: (incomingString: string) => {packets: string[], rest: string} | null;
    private _levelDownCallback: (outgoingPackets: string[]) => string[];

    constructor(
        processorCallback: (incomingString: string) => {packets: string[], rest: string} | null,
        levelDownCallback?: (outgoingPackets: string[]) => string[],
    ) {
        this._processorCallback = processorCallback;
        this._levelDownCallback = levelDownCallback;
    }

    async levelUp(dataPackets: string[]): Promise<string[]> {
        const data = dataPackets.join("");
        this._packetBuilderBuffer = this._packetBuilderBuffer.concat(data);
        const processed = this._processorCallback(this._packetBuilderBuffer);

        if(processed) {
            this._packetBuilderBuffer = processed.rest;
            return processed.packets.length > 0 ? processed.packets : null;
        }

        return null;
    }

    async levelDown(dataPackets: string[]): Promise<string[]> {
        return this._levelDownCallback
            ? this._levelDownCallback(dataPackets)
            : dataPackets;
    }
}
