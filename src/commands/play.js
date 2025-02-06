import {
  AttachmentExtractor,
  SoundCloudExtractor,
  SpotifyExtractor,
} from "@discord-player/extractor";
import ytdl from "@distube/ytdl-core";

import { useMainPlayer, useQueue } from "discord-player";
import fs from "fs";
import path from "path";

import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";

import { count } from "console";
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
   */
  execute: async ({ interaction }) => {
    // Get the player instance, song query and voice channel
    const player = useMainPlayer();

    await player.extractors.loadMulti([
      AttachmentExtractor,
      SoundCloudExtractor,
      SpotifyExtractor,
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

      if (!ytdl.validateURL(url))
        return void interaction.followUp({
          content: "Invalid YouTube URL.",
        });

      // Decode and write the contents to a cookie.txt file
      const cookiesFilePath = "./cookies.txt";
      const abspath = path.resolve(cookiesFilePath);

      const cookieBase64 = process.env.COOKIE_TXT;
      const cookieText = Buffer.from(cookieBase64, 'base64').toString('utf-8');

      // Write the decoded content to cookie.txt
      fs.writeFileSync(abspath, cookieText, 'utf8');

      try {
        
        const metadata = await fetchVideoInfo(url, abspath);
        await playSingleSong(url, abspath);

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
            console.log(error);
            const errorMessage =
              error.message || "An error occurred while playing the song!";
            await interaction.editReply(`Error: ${errorMessage}`);
            break;
        }
      }
    } else if (interaction.options.getString("song")) {
      const query = interaction.options.getString("song", true);

      try {
        const result = await player.play(voiceChannel, query, {
          nodeOptions: {
            metadata: { 
              channel: interaction.channel,
              customMetadata: new Map(),
            },
          },
        });
        
        const embed = new EmbedBuilder()
          .setDescription(
            `Added **[${result.track.title}](${result.track.url})** to the queue.`
          )
          .setThumbnail(result.track.thumbnail || undefined)
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
      let url = interaction.options.getString("playlist");

      if (!ytdl.validateURL(url))
        return void interaction.followUp({
          content: "Invalid YouTube URL.",
        });

      // Decode and write the contents to a cookie.txt file
      const cookiesFilePath = "./cookies.txt";
      const abspath = path.resolve(cookiesFilePath);

      const cookieBase64 = process.env.COOKIE_TXT;
      const cookieText = Buffer.from(cookieBase64, 'base64').toString('utf-8');

      // Write the decoded content to cookie.txt
      fs.writeFileSync(abspath, cookieText, 'utf8');
      console.log("read cookies.txt");
      

      try {
        // Fetch video info
        const ytDlpWrap = new YTDlpWrap();
        
        console.log('ytclp instalantiated');
        // const metadata = await fetchVideoInfo(url);
        let metadataJson = await ytDlpWrap.execPromise([
          "--cookies",
          abspath, // Pass cookies file// Get best audio quality,
          "--flat-playlist",
          "--no-warnings",
          "--dump-single-json",
          "--playlist-items", "1-10",
          url,
        ]);

        const parsedmetadata = JSON.parse(metadataJson);
        const playlistSongs = parsedmetadata.entries.map(element => element.url);
        
        const metadata =  {
          title: parsedmetadata.title,
          url: parsedmetadata.webpage_url,
          thumbnail: parsedmetadata.thumbnails[0].url || null,
          count: parsedmetadata.entries.length,
        };
        
        playlistSongs.forEach(async (song) => {
          playSingleSong(song, abspath);
        });

        // Send an embed with the video info
        const embed = new EmbedBuilder()
          .setDescription(`Added **[${metadata.title}]** to the queue.`)
          .setThumbnail(metadata.thumbnail || null)
          .setFooter({ text: `Count: ${metadata.count}` });

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

    async function playSingleSong(url, abspath) {
      // Fetch video info
      const ytDlpWrap = new YTDlpWrap();
  
      let videometadataJson = await ytDlpWrap.execPromise([
        url,
        "--cookies",
        abspath, // Pass cookies file
        "--format",
        "bestaudio/best", // Get best audio quality
        "--no-warnings",
        "--dump-json",
      ]);
  
      const videometadata = JSON.parse(videometadataJson);
      const metadata = await fetchVideoInfo(url, abspath);
  
      // Extract opus format audio URL
      const audioFormat = videometadata.formats.find(
        (format) => format.acodec === "opus" // Audio-only format
      );
  
      if (!audioFormat) {
        await interaction.editReply("No audio stream found for this URL.");
      }
  
      let queue = useQueue(interaction.guild);
      if (!queue) {
        queue = player.nodes.create(interaction.guild, {
          metadata: {
            channel: interaction.channel,
            customMetadata: new Map(),
          },
        });
      }
  
      try {
        // Store metadata in queue.metadata.customMetadata (Map)
        queue.metadata.customMetadata.set(audioFormat.url, {
          title: metadata.title,
          thumbnail: metadata.thumbnail || null,
          duration: metadata.duration,
          requestedBy: interaction.user,
        });

        await player.play(voiceChannel, audioFormat.url, {
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
            },
          },
        });
      } catch (error) {
        await interaction.editReply("Could not add all songs")
      }
    }

    // fetch song information
    async function fetchVideoInfo(videoUrl, abspath) {
      const ytDlpWrap = new YTDlpWrap();

      let metadataJson = await ytDlpWrap.execPromise([
        videoUrl,
        "--cookies",
        abspath, // Pass cookies file
        "--format",
        "bestaudio/best", // Get best audio quality
        "--no-warnings",
        "--dump-json",
      ]);

      const metadata = JSON.parse(metadataJson);
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
  },
};
