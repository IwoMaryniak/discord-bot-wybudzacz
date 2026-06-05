const express = require("express");
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

// --- Serwer HTTP, w który będzie uderzał Twój Cron Job ---
const app = express();
app.get("/ping", (req, res) => {
  res.send("OK"); // Odpowiedź dla crona, która utrzymuje bota na Renderze przy życiu
});
app.listen(process.env.PORT || 3000, () => console.log("Serwer HTTP aktywny"));

// --- Bot Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
});

client.once("ready", async () => {
  console.log(`Bot nadaje jako: ${client.user.tag}`);
  
  // Rejestracja komendy /wybudz w Discordzie
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [
        new SlashCommandBuilder()
          .setName("wybudz")
          .setDescription("Wchodzi i wychodzi z kanału VC 10 razy")
      ] }
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
      return interaction.reply({ content: "Musisz być na kanale głosowym, żeby mnie użyć!", ephemeral: true });
    }

    await interaction.reply({ content: "Zaczynam spamowanie wejściami! Trzymaj się!", ephemeral: true });

    // Pętla: wejdź i wyjdź 10 razy
    for (let i = 0; i < 10; i++) {
      try {
        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await new Promise((res) => setTimeout(res, 600)); // czas siedzenia na kanale (0.6 sek)
        connection.destroy(); // wyjście
        await new Promise((res) => setTimeout(res, 400)); // przerwa (0.4 sek)
      } catch (e) {
        console.error("Błąd połączenia głosowego:", e);
        break;
      }
    }
  }
});

client.login(process.env.TOKEN);
