import { useTimeline } from "discord-player";
import { SlashCommandBuilder } from "discord.js";

/**
 * This modules defines pause command, allowing user to pause/resume the current song.
 * Checks if a queue exits, pause the current song, and replies with message confirming that song has been paused/resumed.
 */
export default {
  /*
   * Defines the slash command's name and description
   */
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses the currently playing song"),

  /*
   * Handles the execution of the pause command.
   * @param {Object} options - Contains the bot client and interaction data.
   */
  execute: async ({ interaction }) => {
    // Get the queue's timeline
    const timeline = useTimeline({
      node: interaction.guild,
    });

    if (!timeline) {
      return interaction.reply(
        "This server does not have an active player session."
      );
    }

    // Invert the pause state
    const wasPaused = timeline.paused;
    wasPaused ? timeline.resume() : timeline.pause();

    // If the timeline was previously paused, the queue is now back to playing
    return interaction.reply(
      `The player is now ${wasPaused ? "playing" : "paused"}.`
    );
  },
};
