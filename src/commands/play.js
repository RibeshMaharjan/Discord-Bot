import {
  SoundCloudExtractor,
  SpotifyExtractor,
} from "@discord-player/extractor";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  StreamType,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { PassThrough } from "stream";

import { QueryType, useMainPlayer } from "discord-player";

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
  execute: async ({ client, interaction }) => {
    // Get the player instance, song query and voice channel
    const player = useMainPlayer();

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

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const audioBuffer = await downloadAudio(url);

        // Create a PassThrough stream and write the buffer to it
        const audioStream = new PassThrough();
        audioStream.end(audioBuffer);

        // Create an AudioResource from the PassThrough stream
        const resource = createAudioResource(audioStream, {
          inputType: StreamType.Arbitrary,
        });

        // Create an AudioPlayer and play the resource
        const audioplayer = createAudioPlayer();
        audioplayer.play(resource);
        connection.subscribe(audioplayer);

        // Handle playback events
        audioplayer.on(AudioPlayerStatus.Idle, () => {
          console.log("Playback finished.");
          interaction.editReply("Playback finished.");
        });

        audioplayer.on("error", (error) => {
          console.error("Error playing audio:", error);
          interaction.editReply("Failed to play the audio.");
        });

        // const embed = new EmbedBuilder().setDescription(`Now playing audio!`);
        const video = await fetchVideoInfo(url);

        const embed = new EmbedBuilder()
          .setDescription(
            `**${video.duration} songs from [${video.title}](${video.webpage_url})** have been added to the Queue`
          )
          .setThumbnail(video.thumbnail ?? undefined);

        await interaction.editReply({
          embeds: [embed],
        });
      } catch (error) {
        console.error("Error downloading audio:", error);
        interaction.editReply("Failed to download or play the audio.");
      }

      async function downloadAudio(videoUrl) {
        const ytDlpWrap = new YTDlpWrap();
        const passThrough = new PassThrough();

        // Options for downloading audio
        const options = [
          "-x", // Extract audio
          "--audio-format",
          "opus", // Output format
          "-o",
          "audio.mp3", // Output file
        ];

        // Download the audio into a buffer
        return new Promise((resolve, reject) => {
          const chunks = [];

          const readableStream = ytDlpWrap.execStream([videoUrl, ...options]);

          readableStream.on("data", (chunk) => {
            chunks.push(chunk); // Collect data chunks
          });

          readableStream.on("end", () => {
            const buffer = Buffer.concat(chunks); // Combine chunks into a buffer
            resolve(buffer);
          });

          readableStream.on("error", (err) => {
            reject(err);
          });
        });
      }

      // Example function to fetch playlist information
      async function fetchVideoInfo(videoUrl) {
        const ytDlpWrap = new YTDlpWrap();

        // Fetch playlist metadata
        const info = await ytDlpWrap.exec([videoUrl, "-J"]);
        console.log(info);

        const video = JSON.parse(info);

        return {
          title: video.title,
          url: video.webpage_url,
          thumbnail: video.thumbnail || null,
          duration: video.duration,
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

      player.extractors.register(SpotifyExtractor, { name: "spotify" });
      player.extractors.register(SoundCloudExtractor, { name: "soundcloud" });

      try {
        // Search for the playlist using the discord-player
        const result = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_PLAYLIST,
        });

        if (result.tracks.length === 0)
          return void interaction.followUp({
            content: `No playlists found with ${query}`,
          });

        // Add the tracks to the queue
        const playlist = result.playlist;
        await queue.addTracks(result.tracks);
        // embed
        //   .setDescription(
        //     `**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** have been added to the Queue`
        //   )
        //   .setThumbnail(playlist.thumbnail);

        const embed = new EmbedBuilder()
          .setDescription(
            `**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** have been added to the Queue`
          )
          .setThumbnail(playlist.thumbnail ?? undefined);

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
