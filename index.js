const express = require("express");
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.status(200).send("Nadupiacz żyje!"));
app.listen(PORT, "0.0.0.0");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", async () => {
  console.log(`Bot nadaje jako: ${client.user.tag}`);

  // Bezpieczne ustawianie gifa - jak wywali błąd limitu, bot i tak wstanie
  try {
    const avatarPath = path.join(__dirname, "avatar.gif");
    if (fs.existsSync(avatarPath)) {
      await client.user.setAvatar(fs.readFileSync(avatarPath));
      console.log("🟢 Awatar zmieniony!");
    }
  } catch (err) {
    console.log("🔴 Awatar zablokowany przez limit Discorda (ale bot działa dalej):", err.message);
  }

  // Rejestracja komendy
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: [new SlashCommandBuilder().setName("wybudz").setDescription("Spamuje wejściami")],
    });
  } catch (e) { console.error(e); }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "wybudz") return;

  const channel = interaction.member.voice.channel;
  if (!channel) return interaction.reply({ content: "Wejdź na kanał głosowy!", ephemeral: true });

  await interaction.reply({ content: "Zaczynam spamowanie wejściami! Trzymaj się!", ephemeral: true });

  // Ta pętla w JS działała i będzie działać idealnie
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
      break;
    }
  }
});

client.login(process.env.TOKEN);
