import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";

export default class CustomProcessor<T, T2> implements IDataProcessor<T, T2> {
    constructor(
        onLevelUp: CustomProcessor<T, T2>["levelUp"],
        onLevelDown: CustomProcessor<T, T2>["levelDown"],
    ) {
        this.levelUp = onLevelUp;
        this.levelDown = onLevelDown;
    }

    levelUp(dataPackets: T[]): Promise<T2[]> { return null; }

    levelDown(dataPackets: T2[]): Promise<T[]> { return null; }
}
