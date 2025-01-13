import { useQueue } from "discord-player";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

/**
 * This modules defines skip command, allowing user to skip the current song.
 * Checks if a queue exits, skips the current song, and replies with embed message showing the details of current song.
 */
export default {
  /*
   * Defines the slash command's name and description
   */
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song"),
  /*
   * Handles the execution of the skip command
   * @param {Object} options - Contains the bot client and interaction data.
   */
  execute: async ({ interaction }) => {
    const queue = useQueue(interaction.guild);

    // Checks if there is a queue, if not, notify the user and return
    if (!queue) {
      await interaction.reply("Queue is Empty!");
      return;
    }

    // Gets the currently playing song from the queue and skips it
    const currentSong = queue.currentTrack;
    queue.node.skip();

    // Sends a reply with new embed message showing song's details.
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription(`Skipped **${currentSong.title}**`),
      ],
    });
  },
};
