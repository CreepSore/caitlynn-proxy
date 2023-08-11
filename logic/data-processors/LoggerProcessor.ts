import * as util from "util";
import IDataProcessor from "@extensions/Caitlynn.Core/interfaces/IDataProcessor";
import LogBuilder from "@service/logger/LogBuilder";

export default class LoggerProcessor<T> implements IDataProcessor<T, any> {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    levelUp(data: T): Promise<T> {
        LogBuilder
            .start()
            .level("INFO")
            .info(this.name)
            .line(`UP: ${util.inspect(data)}`)
            .done();

        return Promise.resolve(data);
    }

    levelDown(data: T): Promise<T> {
        LogBuilder
            .start()
            .level("INFO")
            .info(this.name)
            .line(`DOWN: ${util.inspect(data)}`)
            .done();

        return Promise.resolve(data);
    }
}
