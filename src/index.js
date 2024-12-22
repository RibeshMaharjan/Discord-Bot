import { log } from "console";
import { channel } from "diagnostics_channel";
import { Client, Events, GatewayIntentBits, GuildChannel } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
});

client.on(Events.GuildMemberAdd, (member) => {
  const CHANNEL_ID= '1079103180853497967';
  console.log(`New Member Joined! ${member}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(`New Member Joined! ${member}`);
    member.send("Welcome To Our Server!");
  } else {
    console.log("Channel not found");
  }
})

client.on(Events.GuildMemberRemove, async (member) => {
  const CHANNEL_ID= '1079103180853497967';
  console.log(`Member Left! ${member}`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    channel.send(`Member Left! ${member}`);
    try {
      await member.send(`Byeeee!`);
      console.log(`Sent goodbye message to ${member.displayName}`);
    } catch (error) {
        if (error.code === 50007) {
            console.error(`Cannot send messages to ${member.displayName}:`, error.message);
        } else {
            console.error(`Failed to send message to ${member.displayName}:`, error);
        }
    }
  } else {
    console.log("Channel not found");
  }
})

client.on(Events.MessageCreate, (message) => {
  // console.log(message.content);
  if (message.author.bot) return;
  message.reply({
    content: `Hey ${message}`,
  });
});

client.login(process.env.TOKEN);
