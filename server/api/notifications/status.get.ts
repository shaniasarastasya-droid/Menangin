import { getChannelIntegrationStatus } from '../../utils/notification-channels'

export default defineEventHandler(() => getChannelIntegrationStatus())
