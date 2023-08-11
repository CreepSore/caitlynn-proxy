import PacketConstructorProcessor from "./PacketConstructorProcessor";

export default class NewlinePacketProcessor extends PacketConstructorProcessor {
    lineFeed: string = "\n";

    constructor(crlf: boolean = false) {
        super((currentPacket: string) => {
            const packets: string[] = [];

            let toProcess = currentPacket;
            let newlineIndex = currentPacket.indexOf(this.lineFeed);
            while(newlineIndex > -1) {
                packets.push(toProcess.substring(0, newlineIndex));
                toProcess = currentPacket.substring(newlineIndex + this.lineFeed.length);
                newlineIndex = toProcess.indexOf(this.lineFeed);
            }

            return {
                packets,
                rest: toProcess,
            };
        }, (packets: string[]) => [packets.join(this.lineFeed).concat(this.lineFeed)]);

        this.lineFeed = crlf ? "\r\n" : "\n";
    }
}
