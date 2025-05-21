require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

// Load config from .env
const MODMAIL_GUILD_ID = process.env.MODMAIL_GUILD_ID;
const MODMAIL_CATEGORY_ID = process.env.MODMAIL_CATEGORY_ID;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // DM from user
  if (message.channel.type === 1) {
    const guild = client.guilds.cache.get(MODMAIL_GUILD_ID);
    if (!guild) return;

    let modmailChannel = guild.channels.cache.find(
      (ch) => ch.name === `modmail-${message.author.id}`
    );

    if (!modmailChannel) {
      modmailChannel = await guild.channels.create({
        name: `modmail-${message.author.id}`,
        type: 0, // GUILD_TEXT
        parent: MODMAIL_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          // Add more perms if needed for mods here
        ],
      });
    }

    modmailChannel.send({
      content: `**Message from <@${message.author.id}>:**\n${message.content}`,
    });
  }

  // Message in modmail channel from mods
  if (message.guild && message.channel.name.startsWith('modmail-')) {
    const userId = message.channel.name.split('modmail-')[1];
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;

    if (message.content.length > 0) {
      user.send(`**Reply from mods:**\n${message.content}`).catch(() => {
        message.channel.send('Could not send message to user.');
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
