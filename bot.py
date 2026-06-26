import discord
from discord import app_commands
import os
import asyncio
from aiohttp import web

# --- SERWER HTTP (Utrzymanie na Renderze) ---
async def handle_ping(request):
    return web.Response(text="OK")

async def handle_root(request):
    return web.Response(text="Bot żyje i ma się dobrze!")

app = web.Application()
app.router.add_get('/ping', handle_ping)
app.router.add_get('/', handle_root)

async def start_web_server():
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.environ.get("PORT", 10000))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    print(f"Serwer HTTP aktywny na porcie {port}")

# --- BOT DISCORD ---
class MyBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.guilds = True
        intents.voice_states = True
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        # Odpalenie serwera HTTP w tle
        asyncio.create_task(start_web_server())
        # Wymuszenie załadowania kodeka audio, jeśli jest dostępny
        if not discord.opus.is_loaded():
            try:
                discord.opus.load_opus()
            except Exception as e:
                print(f"Informacja o Opus: {e} (zazwyczaj nie wpływa to na samo dołączanie)")
        await self.tree.sync()

bot = MyBot()

@bot.event
async def on_ready():
    print(f'Bot działa jako: {bot.user}')

    # ===== ANIMOWANY AVATAR =====
    try:
        if os.path.exists("avatar.gif"):
            with open("avatar.gif", "rb") as image:
                await bot.user.edit(avatar=image.read())
            print("🟢 Ustawiono animowany avatar bota!")
        else:
            print("🔴 Błąd: Brak pliku avatar.gif")
    except discord.HTTPException as e:
        print(f"🔴 Awatar: {e.text} (Prawdopodobnie limit Discorda - spróbuj ponownie za godzinę)")
    except Exception as e:
        print(f"🔴 Inny błąd awatara: {e}")

# Komenda /wybudz
@bot.tree.command(name="wybudz", description="Wchodzi i wychodzi z kanału VC 10 razy")
async def wybudz(interaction: discord.Interaction):
    # Sprawdzenie czy użytkownik jest na kanale
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("Musisz być na kanale głosowym, żeby mnie użyć!", ephemeral=True)
        return

    channel = interaction.user.voice.channel
    await interaction.response.send_message("Zaczynam spamowanie wejściami! Trzymaj się!", ephemeral=True)

    for i in range(10):
        try:
            # Rozłączamy bota jeśli już gdzieś wisiał, żeby zresetować połączenie
            if interaction.guild.voice_client:
                await interaction.guild.voice_client.disconnect(force=True)
                await asyncio.sleep(0.2)

            # Połączenie z kanałem
            vc = await channel.connect(timeout=10.0, reconnect=True)
            await asyncio.sleep(0.6)
            
            # Rozłączenie
            await vc.disconnect(force=True)
            await asyncio.sleep(0.4)
            
        except Exception as e:
            print(f" Błąd podczas próby {i+1}/10: {e}")
            await asyncio.sleep(0.5)

token = os.environ.get("TOKEN")
if token:
    bot.run(token)
else:
    print("🔴 Brak zmiennej TOKEN!")
