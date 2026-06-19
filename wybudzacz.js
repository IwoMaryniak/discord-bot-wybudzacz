const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");
const fs = require("fs");

// --- SERWER HTTP (Render / Cron) ---
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.status(200).send("Bot żyje i ma się dobrze!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer HTTP aktywny na porcie ${PORT}`);
});

// --- BOT DISCORD ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

client.once("ready", async () => {
  console.log(`Bot nadaje jako: ${client.user.tag}`);

  // ===== ANIMOWANY AVATAR =====
  try {
    const avatar = fs.readFileSync("./avatar.gif");
    await client.user.setAvatar(avatar);
    console.log("🟢 Ustawiono animowany avatar bota!");
  } catch (err) {
    console.log("🔴 Błąd avatara:", err);
  }
  // ============================

  // Rejestracja komendy /wybudz
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: [
          new SlashCommandBuilder()
            .setName("wybudz")
            .setDescription("Wchodzi i wychodzi z kanału VC 10 razy")
        ]
      }
    );

    console.log("Komenda /wybudz jest gotowa na serwerze!");
  } catch (error) {
    console.error("Błąd rejestracji komendy:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "wybudz") {
    const member = interaction.member;
    const channel = member.voice.channel;

    if (!channel) {
      return interaction.reply({
        content: "Musisz być na kanale głosowym, żeby mnie użyć!",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "Zaczynam spamowanie wejściami! Trzymaj się!",
      ephemeral: true
    });

    for (let i = 0; i < 10; i++) {
      try {
        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await new Promise((res) => setTimeout(res, 600));
        connection.destroy();
        await new Promise((res) => setTimeout(res, 400));
      } catch (e) {
        console.error("Błąd połączenia głosowego:", e);
        break;
      }
    }
  }
});

client.login(process.env.TOKEN);
