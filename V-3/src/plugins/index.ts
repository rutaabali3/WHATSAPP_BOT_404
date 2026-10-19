import { PluginManager } from '../plugin.js';
import { generalCommands } from './general.js';
import { privacyCommands } from './privacy.js';
import { groupCommands } from './group.js';
import { mediaCommands } from './media.js';
import { toolCommands } from './tools.js';
import { funCommands } from './fun.js';

export function registerAllPlugins(manager: PluginManager): void {
  const all = [
    ...generalCommands,
    ...privacyCommands,
    ...groupCommands,
    ...mediaCommands,
    ...toolCommands,
    ...funCommands
  ];

  for (const cmd of all) {
    manager.register(cmd);
  }
}
