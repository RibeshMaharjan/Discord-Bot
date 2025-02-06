import { useMainPlayer, useQueue } from "discord-player";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

/**
 * This modules defines exit command, allowing user to clear the queue and disconnect the bot.
 * Checks if a queue exists, clears it, adisconnects the bot from the voice channel,
 * and sends a confirmation message.
 */
export default {
  /*
   * Defines the slash command's name and description
   */
  data: new SlashCommandBuilder()
    .setName("exit")
    .setDescription("Exits the Voice channel"),

  /*
   * Handles the execution of the exit command.
   * @param {Object} options - Contains the bot client and interaction data.
   */
  execute: async ({ interaction }) => {
    const player = useMainPlayer();
    const queue = useQueue(interaction.guild);

    // Checks if there is a queue, if not, notify the user and return
    if (!queue) {
      await interaction.reply("There is no song playing.");
    }

    // Clears the queue and disconnects from the voice channel
    queue.clear();
    queue.delete();

    // Notify the user that the bot has stopped and left the channel
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Disconnected")
          .setDescription(
            "The queue has been cleared, and I've left the voice channel.\nSee you next time!"
          )
          .setFooter({ text: "Use /play to start music agian!" }),
      ],
    });
  },
};
