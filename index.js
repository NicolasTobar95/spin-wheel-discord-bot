require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// 1. Leer dinámicamente todos los archivos en la carpeta 'commands'
const commandsToRegister = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Verificar que el comando esté bien estructurado
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandsToRegister.push(command.data.toJSON());
    } else {
        console.log(`[ADVERTENCIA] El comando en ${filePath} no tiene la propiedad 'data' o 'execute'.`);
    }
}

client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    // 2. Registrar TODOS los comandos encontrados en Discord
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log(`Empezando a refrescar ${commandsToRegister.length} comandos de aplicación (/) ...`);
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsToRegister }, // Enviamos el array con todos los comandos
        );
        console.log('✅ Comandos recargados exitosamente.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
        }
    }
});

// --- ACTIVAR DEBUG DE RED ---
client.on('debug', console.log);
client.on('error', console.error);

console.log("🔄 Intentando conectar a los servidores de Discord...");

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error("❌ ERROR CRÍTICO AL CONECTAR:", error);
});

// --- Servidor Web Dummy para Render ---
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot de Ruleta Activo\n');
}).listen(port, () => {
    console.log(`✅ Servidor web encendido en el puerto ${port} (Render OK)`);

});


