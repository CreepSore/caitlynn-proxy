export default interface IDataChannel {
    get isEstablished(): boolean;

    start(): Promise<void>;
    stop(): Promise<void>;

    send(data: Buffer): Promise<void>;
    onDataReceived(callback: (data: Buffer) => void): void;
    onConnectionEstablished(callback: () => void): void;
    onConnectionClosed(callback: () => void): void;
}
