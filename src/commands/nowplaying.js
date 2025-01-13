import { useQueue } from "discord-player";
import { SlashCommandBuilder } from "discord.js";

/**
 * This modules defines nowplaying command, allowing user to view the currently playing song.
 * Checks if a queue exits, resume the current song, and replies with message confirming that the song has been paused.
 */
export default {
  /*
   * Defines the slash command's name and description
   */
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Display the currently playing song"),

  /*
   * Handles the execution of the resume command.
   * @param {Object} options - Contains the bot client and interaction data.
   */
  execute: async ({ interaction }) => {
    const queue = useQueue(interaction.guild);

    // Checks if there is a queue, if not, notify the user and return
    if (!queue) {
      await interaction.reply("There is no song in the queue.");
      return;
    }

    // Get the currently playing song
    const currentSong = queue.currentTrack;

    // Check if there is a song playing
    if (!currentSong) {
      return interaction.reply("No song is currently playing.");
    }
    // Send the currently playing song information
    return interaction.reply(
      `Now playing: ${currentSong.title}\n${queue.node.createProgressBar()}`
    );
  },
};
