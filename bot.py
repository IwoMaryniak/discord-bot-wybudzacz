import discord
from discord import app_commands
import os
import asyncio
from aiohttp import web

# --- SERWER HTTP (Render / Cron) ---
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
        asyncio.create_task(start_web_server())
        await self.tree.sync()

bot = MyBot()

@bot.event
async def on_ready():
    print(f'Bot nadaje jako: {bot.user}')

    # ===== ANIMOWANY AVATAR =====
    try:
        if os.path.exists("avatar.gif"):
            with open("avatar.gif", "rb") as image:
                await bot.user.edit(avatar=image.read())
            print("🟢 Ustawiono animowany avatar bota!")
        else:
            print("🔴 Błąd: Plik avatar.gif nie istnieje w głównym folderze!")
    except discord.HTTPException as e:
        print("🔴 Szczegółowy błąd przy ustawianiu avatara:")
        print(e)
    # ============================

@bot.tree.command(name="wybudz", description="Wchodzi i wychodzi z kanału VC 10 razy")
async def wybudz(interaction: discord.Interaction):
    if not interaction.user.voice or not interaction.user.voice.channel:
        await interaction.response.send_message("Musisz być na kanale głosowym, żeby mnie użyć!", ephemeral=True)
        return

    channel = interaction.user.voice.channel
    await interaction.response.send_message("Zaczynam spamowanie wejściami! Trzymaj się!", ephemeral=True)

    for i in range(10):
        try:
            vc = await channel.connect()
            await asyncio.sleep(0.6)
            await vc.disconnect()
            await asyncio.sleep(0.4)
        except Exception as e:
            print("Błąd połączenia głosowego:", e)
            break

token = os.environ.get("TOKEN")
if token:
    bot.run(token)
else:
    print("🔴 Błąd: Brak zmiennej środowiskowej TOKEN!")
