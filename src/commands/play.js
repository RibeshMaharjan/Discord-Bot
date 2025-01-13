import {
  AttachmentExtractor,
  DefaultExtractors,
  SoundCloudExtractor,
  SpotifyExtractor,
} from "@discord-player/extractor";
import { exec } from "child_process";
import { useMainPlayer } from "discord-player";
import {
  EmbedBuilder,
  PermissionsBitField,
  REST,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    // Play Commands
    .setName("play")
    .setDescription("Plays Music")
    .addStringOption(
      (option) =>
        option
          .setName("song") // Option name
          .setDescription("The song to play") // Option description
          .setRequired(false) // Make the option required
    )
    .addStringOption(
      (option) =>
        option
          .setName("playlist") // Option name
          .setDescription("Url of the Playlist") // Option description
          .setRequired(false) // Make the option required
    )
    .addStringOption(
      (option) =>
        option
          .setName("url") // Option name
          .setDescription("Url of the Song") // Option description
          .setRequired(false) // Make the option required
    ),
  /* Command Execution code
   *Add song to the queue
   *
   */
  execute: async ({ interaction }) => {
    // Get the player instance, song query and voice channel
    const player = useMainPlayer();
    // Register the extractors
    player.extractors.register(AttachmentExtractor, { name: "attachment" });
    player.extractors.register(SpotifyExtractor, { name: "spotify" });
    player.extractors.register(SoundCloudExtractor, { name: "soundcloud" });

    const voiceChannel = interaction.member.voice.channel;

    // Check if the user is in a voice channel
    if (!voiceChannel) {
      await interaction.reply("Your must be in a voice channel.");
      return;
    }

    // Check if the bot is already playing in a different voice channel
    if (
      interaction.guild.members.me.voice.channel &&
      interaction.guild.members.me.voice.channel !== voiceChannel
    ) {
      return interaction.reply(
        "I am already playing in a different voice channel!"
      );
    }

    // Check if the bot has permission to join the voice channel
    if (
      !voiceChannel
        .permissionsFor(interaction.guild.members.me)
        .has(PermissionsBitField.Flags.Connect)
    ) {
      return interaction.reply(
        "I do not have permission to join your voice channel!"
      );
    }

    // Check if the bot has permission to speak in the voice channel
    if (
      !voiceChannel
        .permissionsFor(interaction.guild.members.me)
        .has(PermissionsBitField.Flags.Speak)
    ) {
      return interaction.reply(
        "I do not have permission to speak in your voice channel!"
      );
    }

    await interaction.deferReply(); // Acknowledge the interaction to avoid timeouts

    if (interaction.options.getString("url")) {
      let requested = interaction.options.getString("url");
      console.log(requested);
      return;
    } else if (interaction.options.getString("song")) {
      const query = interaction.options.getString("song", true);

      try {
        // Play the song in the voice channe
        const result = await player.play(voiceChannel, query, {
          nodeOptions: {
            metadata: { channel: interaction.channel }, // Store text channel as metadata on the queue
          },
        });

        const embed = new EmbedBuilder()
          .setDescription(
            `Added **[${result.track.title}](${result.track.url})** to the queue.`
          )
          .setThumbnail(result.track.thumbnail ?? undefined)
          .setFooter({ text: `Duration: ${result.track.duration}` });

        await interaction.editReply({
          embeds: [embed],
        });
      } catch (error) {
        // Handle any errors that occur
        switch (error.code) {
          case "ERR_NO_RESULT":
            await interaction.editReply(
              `No results found for "${query}". Please try a different search term.`
            );
            break;
          case "InteractionNotReplied":
            await interaction.editReply(
              "It seems I didn't respond in time. Please try again."
            );
            break;
          case 10062:
            await interaction.editReply(
              "Unknown interaction error. The command might have expired."
            );
            break;
          default:
            const errorMessage =
              error.message || "An error occurred while playing the song!";
            await interaction.editReply(`Error: ${errorMessage}`);
            break;
        }
      }
    } else if (interaction.options.getString("playlist")) {
      const query = interaction.options.getString("playlist", true);
      try {
      } catch (error) {
        // Handle any errors that occur
        switch (error.code) {
          case "ERR_NO_RESULT":
            await interaction.editReply(
              `No results found for "${query}". Please try a different search term.`
            );
            break;
          case "InteractionNotReplied":
            await interaction.editReply(
              "It seems I didn't respond in time. Please try again."
            );
            break;
          case 10062:
            await interaction.editReply(
              "Unknown interaction error. The command might have expired."
            );
            break;
          default:
            console.log(error);

            const errorMessage =
              error.message || "An error occurred while playing the song!";
            await interaction.editReply(`Error: ${errorMessage}`);
            break;
        }
      }
    } else {
      await interaction.editReply(`Please atleast one option`);
      return;
    }
  },
};
