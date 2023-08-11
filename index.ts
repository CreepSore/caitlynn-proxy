import {EventEmitter} from "events";

import IExecutionContext, { IAppExecutionContext, ICliExecutionContext } from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";
import Core from "@extensions/Core";
import CaitlynnBuilder from "./logic/CaitlynnBuilder";
import TcpServerChannel from "./logic/channels/TcpServerChannel";
import EchoChannel from "./logic/channels/EchoChannel";
import PacketConstructorProcessor from "./logic/data-processors/PacketConstructorProcessor";
import LogBuilder from "@service/logger/LogBuilder";
import NewlinePacketProcessor from "./logic/data-processors/NewlinePacketProcessor";
import LoggerProcessor from "./logic/data-processors/LoggerProcessor";
import CustomProcessor from "./logic/data-processors/CustomProcessor";
import StringPreprocessor from "./logic/data-processors/StringPreprocessor";
import TcpClientChannel from "./logic/channels/TcpClientChannel";

class CaitlynnCoreConfig {

}

export default class CaitlynnCore implements IExtension {
    static metadata: ExtensionMetadata = {
        name: "Caitlynn.Core",
        version: "1.0.0",
        description: "Caitlynn Proxy Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CaitlynnCore.metadata;

    config: CaitlynnCoreConfig = new CaitlynnCoreConfig();
    events: EventEmitter = new EventEmitter();
    $: <T extends IExtension>(name: string|Function & { prototype: T }) => T;

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        this.$ = <T extends IExtension>(name: string|Function & { prototype: T }) => executionContext.extensionService.getExtension(name) as T;
        if(executionContext.contextType === "cli") {
            await this.startCli(executionContext);
            return;
        }
        else if(executionContext.contextType === "app") {
            await this.startMain(executionContext);
            return;
        }
    }

    async stop(): Promise<void> {

    }

    private async startCli(executionContext: ICliExecutionContext): Promise<void> {

    }

    private async startMain(executionContext: IAppExecutionContext): Promise<void> {
        const caitlynn = new CaitlynnBuilder()
            .setIncomingChannel(new TcpServerChannel({host: "127.0.0.1", port: 1234}))
            .setOutgoingChannel(new TcpClientChannel({host: "78.46.41.219", port: 2233}))
            .done();

        await caitlynn.start();
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CaitlynnCoreConfig(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
