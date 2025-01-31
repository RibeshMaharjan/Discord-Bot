import { GuildQueueEvent, Player } from "discord-player";
import {
  Client,
  Collection,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Load all the commands
const commands = [];
client.commands = new Collection();

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandPath, file);
  const command = await import(filePath);

  client.commands.set(command.default.data.name, command);
  commands.push(command.default.data.toJSON());
}

// Setup player
client.player = new Player(client);

client.on(Events.ClientReady, (readyClient) => {
  const guildIds = client.guilds.cache.map((guild) => guild.id);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  for (const guildId of guildIds) {
    console.log("Started refreshing application (/) commands.");

    rest
      .put(Routes.applicationGuildCommands(process.env.CLIENTID, guildId), {
        body: commands,
      })
      .then(() => {
        console.log(`Successfully reloaded application (/) commands.`);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.default.execute({ interaction });
  } catch (err) {
    console.error(err);
    await interaction.reply("An error occured while executing that command.");
  }
});

/*
 * handles the event when the track is add to queue
 * Gets the metadata of the track stored(if available) on the queue
 * @Purpose: to modify the track extracted from url
 */
client.player.events.on(GuildQueueEvent.AudioTrackAdd, async (queue, track) => {
  const { customMetadata } = queue.metadata;

  if (customMetadata) {
    track.title = customMetadata.title;
    track.thumbnail = customMetadata.thumbnail || null;
    track.duration = customMetadata.duration;
    track.requestedBy = customMetadata.requestedBy;
  }

  // remove the track metadata
  queue.metadata.customMetadata = null;
});

/*
 * Handles the event when a track starts playing
 * Gets the metadata stored on the queue
 * Sends the message to the channel
 */
client.player.events.on(GuildQueueEvent.PlayerStart, async (queue, track) => {
  const { channel } = queue.metadata;

  const embed = new EmbedBuilder()
    .setDescription(`Now playing: **[${track.title}]**`)
    .setThumbnail(track.thumbnail || null)
    .setFooter({ text: `Duration: ${track.duration}` });

  await channel.send({ embeds: [embed] });
});

/*
 * Handles the event when a track finishes playing
 * Gets the metadata when a track finishes playing
 *  Sends the message to the channel
 */
client.player.events.on(GuildQueueEvent.PlayerFinish, async (queue, track) => {
  const { channel } = queue.metadata;

  const embed = new EmbedBuilder()
    .setDescription(`Finished playing **[${track.title}]**`)
    .setThumbnail(track.thumbnail || null)
    .setFooter({ text: `Duration: ${track.duration}` });

  await channel.send({ embeds: [embed] });
});

client.on(Events.GuildMemberAdd, (member) => {
  const CHANNEL_ID = "1079103180853497967";
  console.log(`New Member Joined! ${member}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(`New Member Joined! ${member}`);
    member.send("Welcome To Our Server!");
  } else {
    console.log("Channel not found");
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  const CHANNEL_ID = "1079103180853497967";
  console.log(`Member Left! ${member}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(`Member Left! ${member}`);
    try {
      await member.send(`Byeeee!`);
      console.log(`Sent goodbye message to ${member.displayName}`);
    } catch (error) {
      if (error.code === 50007) {
        console.error(
          `Cannot send messages to ${member.displayName}:`,
          error.message
        );
      } else {
        console.error(
          `Failed to send message to ${member.displayName}:`,
          error
        );
      }
    }
  } else {
    console.log("Channel not found");
  }
});

client.login(process.env.TOKEN);
