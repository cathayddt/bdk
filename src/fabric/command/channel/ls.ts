import { Arguments } from 'yargs';
import { logger } from '../../../util';
import Channel from '../../service/channel';
import config from '../../config';
import ora from 'ora';

export const command = 'ls';

export const desc = 'List all channels in the network';

export const builder = {};

export const handler = async (argv: Arguments) => {
  const channel = new Channel(config);
  const spinner = ora('Listing all channels in the network...').start();

  try {
    const channels = await channel.listAllChannels();
    spinner.succeed('Channels listed successfully!');
    logger.info('Channels in the network:', channels);
  } catch (error) {
    spinner.fail('Failed to list channels');
    logger.error('Error listing channels:', error);
  }
};
