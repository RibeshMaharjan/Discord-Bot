import { useQueue } from "discord-player";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

/**
 * This modules defines queue command, allowing user to view the songs in the queue.
 * Checks if a queue exists, lists the songs in the queue.
 */
export default {
  /*
   * Defines the slash command's name and description
   */
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shows the songs in the queue"),

  /*
   * Handles the execution fo the queue command.
   * @param {Object} options - Contains the bot client and interaction data.
   */
  execute: async ({ interaction }) => {
    const queue = useQueue(interaction.guild);

    // Checks if there is a queue, if not, notify the user and return
    if (!queue) {
      interaction.reply("There is no song playing");
      return;
    }

    /*
     * Creates a formatted string listing all songs in the queue.
     * Each line shows postion, duration, title, and the users who requested the song.
     */
    const queueString = queue.tracks.data
      .map((song, i) => {
        return `${i + 1}) [${song.duration}]\` ${song.title}`;
      })
      .join("\n");

    const currentSong = queue.currentTrack;

    // Sends a embed message showing the current song and queue list
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `**Currently Playing:**\n\` ${currentSong.title}\n\n**Queue:**\n${queueString}`
          )
          .setThumbnail(currentSong.thumbnail || undefined),
      ],
    });
  },
};
