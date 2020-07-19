import {
  IAppAccessors, IConfigurationExtend, IEnvironmentRead, ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { NotifyWebhookEndpooint } from './endpoints/notifyWebhook';

export class UptimeRobotApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors?: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
      await configuration.settings.provideSetting({
        id: 'sender',
        type: SettingType.STRING,
        packageValue: 'uptimerobot.bot',
        required: true,
        public: false,
        i18nLabel: 'customize_sender',
        i18nDescription: 'customize_sender_description',
      });

      await configuration.settings.provideSetting({
        id: 'name',
        type: SettingType.STRING,
        packageValue: 'Uptime Robot',
        required: true,
        public: false,
        i18nLabel: 'customize_alias',
        i18nDescription: 'customize_alias_description',
      });

      await configuration.settings.provideSetting({
        id: 'icon',
        type: SettingType.STRING,
        packageValue: 'https://github.com/tgardner851/Rocket.Chat.App-UptimeRobot/raw/master/icon.jpg',
        required: true,
        public: false,
        i18nLabel: 'customize_icon',
        i18nDescription: 'customize_icon_description',
      });

      await configuration.api.provideApi({
        visibility: ApiVisibility.PRIVATE,
        security: ApiSecurity.UNSECURE,
        endpoints: [new NotifyWebhookEndpooint(this)],
      });
    }
}
