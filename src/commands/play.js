import {
  AttachmentExtractor,
  SoundCloudExtractor,
  SpotifyExtractor,
} from "@discord-player/extractor";
import ytdl from "@distube/ytdl-core";

import { QueryType, useMainPlayer, useQueue } from "discord-player";

import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";

import ytDlpWrapModule from "yt-dlp-wrap"; // Import the module
const YTDlpWrap = ytDlpWrapModule.default; // Access the default export

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

    await player.extractors.loadMulti([
      AttachmentExtractor,
      SpotifyExtractor,
      SoundCloudExtractor,
    ]);

    const voiceChannel = interaction.member.voice.channel;

    await interaction.deferReply(); // Acknowledge the interaction to avoid timeouts

    // Check if the user is in a voice channel
    if (!voiceChannel) {
      await interaction.editReply("Your must be in a voice channel.");
      return;
    }

    // Check if the bot is already playing in a different voice channel
    if (
      interaction.guild.members.me.voice.channel &&
      interaction.guild.members.me.voice.channel !== voiceChannel
    ) {
      return interaction.editReply(
        "I am already playing in a different voice channel!"
      );
    }

    // Check if the bot has permission to join the voice channel
    if (
      !voiceChannel
        .permissionsFor(interaction.guild.members.me)
        .has(PermissionsBitField.Flags.Connect)
    ) {
      return interaction.editReply(
        "I do not have permission to join your voice channel!"
      );
    }

    // Check if the bot has permission to speak in the voice channel
    if (
      !voiceChannel
        .permissionsFor(interaction.guild.members.me)
        .has(PermissionsBitField.Flags.Speak)
    ) {
      return interaction.editReply(
        "I do not have permission to speak in your voice channel!"
      );
    }

    if (interaction.options.getString("url")) {
      let url = interaction.options.getString("url");
      console.log(url);

      if (!ytdl.validateURL(url))
        return void interaction.followUp({
          content: "Invalid YouTube URL.",
        });

      // Path to cookies.txt file
      const cookiesFilePath = "../../cookies.txt";

      try {
        // Fetch video info
        const ytDlpWrap = new YTDlpWrap();
        const videometadata = await ytDlpWrap.getVideoInfo(url, {
          cookies: cookiesFilePath,
        });
        const metadata = await fetchVideoInfo(url);

        // Extract opus format audio URL
        const audioFormat = videometadata.formats.find(
          (format) => format.acodec === "opus" // Audio-only format
        );

        if (!audioFormat) {
          throw new Error("No audio stream found for this URL.");
        }

        console.log(audioFormat);

        let queue = useQueue(interaction.guild);
        if (!queue) {
          queue = player.nodes.create(interaction.guild, {
            metadata: {
              channel: interaction.channel,
            },
          });
        }

        // Assign audio metadata of current track to queue
        queue.metadata.customMetadata = {
          title: metadata.title,
          thumbnail: metadata.thumbnail || null,
          duration: metadata.duration,
          requestedBy: interaction.user,
        };

        await player.play(voiceChannel, audioFormat.url, {
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
            },
          },
        });

        // Send an embed with the video info
        const embed = new EmbedBuilder()
          .setDescription(`Added **[${metadata.title}]** to the queue.`)
          .setThumbnail(metadata.thumbnail || null)
          .setFooter({ text: `Duration: ${metadata.duration}` });

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        switch (error.code) {
          case "ERR_NO_RESULT":
            console.log(error);
            await interaction.editReply(
              `No results found for "${url}". Please try a different search term.`
            );
            break;
          case "InteractionNotReplied":
            console.log(error);
            await interaction.editReply(
              "It seems I didn't respond in time. Please try again."
            );
            break;
          case 10062:
            console.log(error);
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

      // fetch song information
      async function fetchVideoInfo(videoUrl) {
        const ytDlpWrap = new YTDlpWrap();

        // Fetch song metadata
        let metadata = await ytDlpWrap.getVideoInfo(videoUrl, {
          cookies: cookiesFilePath,
        });

        const minute = Math.floor(metadata.duration / 60);
        const second = metadata.duration % 60;

        const duration = `${minute}:${second}`;

        return {
          title: metadata.title,
          url: metadata.webpage_url,
          thumbnail: metadata.thumbnail || null,
          duration: duration,
        };
      }
    } else if (interaction.options.getString("song")) {
      const query = interaction.options.getString("song", true);

      try {
        const result = await player.play(voiceChannel, query, {
          nodeOptions: {
            metadata: { channel: interaction.channel },
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
        switch (error.code) {
          case "ERR_NO_RESULT":
            console.log(error);
            await interaction.editReply(
              `No results found for "${query}". Please try a different search term.`
            );
            break;
          case "InteractionNotReplied":
            console.log(error);
            await interaction.editReply(
              "It seems I didn't respond in time. Please try again."
            );
            break;
          case 10062:
            console.log(error);
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
    } else if (interaction.options.getString("playlist")) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle("Playlist Slash Command - Coming Soon!")
            .setDescription(
              "The `/playlist` slash command still under development.\n\nIn the meantime, try other commands to enjoy music!"
            )
            .setFooter({ text: "Use /play to start music again!" }),
        ],
      });
    } else {
      await interaction.editReply(`Please atleast one option`);
      return;
    }
  },
};
