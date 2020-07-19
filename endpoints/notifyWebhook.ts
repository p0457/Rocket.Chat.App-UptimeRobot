import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, example, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IMessageAttachment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';

export class NotifyWebhookEndpooint extends ApiEndpoint {
    public path = 'notify';

    @example({
      query: {
          rooms: '@user,#room',
      },
    })
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse> {
        if (!request.content) {
          return this.success();
        }

        if (!request.query || !request.query.rooms) {
          console.log('[UptimeRobotApp.NotifyWebhookEndpooint] Rooms not provided', request.query);
          return this.success();
        }

        const rooms = request.query.rooms.split(',');
        await rooms.forEach(async (roomToSend) => {
          roomToSend = roomToSend.trim();

          const payload = request.content;

          const avatarUrl = await read.getEnvironmentReader().getSettings().getValueById('icon');
          const alias = await read.getEnvironmentReader().getSettings().getValueById('name');
          const senderName = await read.getEnvironmentReader().getSettings().getValueById('sender');
          const sender = await read.getUserReader().getById(senderName);

          let room;
          if (roomToSend.startsWith('@')) {
            room = await read.getRoomReader().getDirectByUsernames([senderName, roomToSend.substring(1, roomToSend.length)]);
          } else if (roomToSend.startsWith('#')) {
            room = await read.getRoomReader().getByName(roomToSend.substring(1, roomToSend.length));
          }

          if (room) {

            const getData = (obj) => {
              let statusColor = '#A63636';
              let statusText = 'DOWN';
              let alertDuration = '0';
              if (obj.alertType === '2') {
                statusColor = '#36A64F';
                statusText = 'UP';
                alertDuration = convertAlertDuration(obj.alertDuration);
              }

              return {
                statusColor: statusColor,
                statusText: statusText,
                isUp: obj.alertType === '2',
                monitorID: obj.monitorID,
                monitorURL: obj.monitorURL,
                monitorFriendlyName: obj.monitorFriendlyName,
                alertDetails: obj.alertDetails,
                alertDuration: alertDuration,
              };
            };

            const convertAlertDuration = (seconds) => {
              let days = Math.floor(seconds / (3600 * 24));
              seconds -= days * 3600 * 24;
              let hours = Math.floor(seconds / 3600);
              seconds -= hours * 3600;
              let minutes = Math.floor(seconds / 60);
              seconds  -= minutes * 60;

              let result = '';
              if (days > 0) {
                result += ' ' + days + ' days';
              }
              if (hours > 0) {
                result += ' ' + hours + ' hours';
              }
              if (minutes > 0) {
                result += ' ' + minutes + ' minutes';
              }
              if (seconds > 0) {
                result += ' ' + seconds + ' seconds';
              }

              return result;
            };

            const data = getData(payload);

            let title = `${data.monitorFriendlyName} is ${data.statusText}!`;
            let text = ``;
            if(data.isUp) {
              text += `It was down for ${data.alertDuration}.`;
            } else {
              text += `Reason: ${data.alertDetails}.`;
            }
            const color = data.statusColor;
            const url = data.monitorURL;

            const attachment: IMessageAttachment = {
              collapsed: true,
              color,
              title: {
                value: title,
                link: url
              },
              text
            };

            const message = modify.getCreator().startMessage({
              room,
              sender,
              groupable: false,
              avatarUrl,
              alias
            }).setAttachments([attachment]);

            await modify.getCreator().finish(message);
          } else {
            console.log('[UptimeRobotApp.NotifyWebhookEndpooint] Room could not be determined', roomToSend);
          }
        });

        return this.success();
    }
}
