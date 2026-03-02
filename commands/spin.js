const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { generateSpinGif } = require('../services/spinAnimation.js');
const en = require('../locales/en.json');
const es = require('../locales/es.json');

const activeSpins = new Set();

function getLocale(localeString) {
    if (localeString && localeString.startsWith('es')) return es;
    return en;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spin')
        .setNameLocalizations({
            'es-ES': 'spin',
            'es-419': 'spin'
        })
        .setDescription('Spin the wheel with custom options')
        .setDescriptionLocalizations({
            'es-ES': 'Gira la ruleta con opciones personalizadas',
            'es-419': 'Gira la ruleta con opciones personalizadas'
        })
        .addStringOption(option =>
            option.setName('options')
                .setNameLocalizations({
                    'es-ES': 'opciones',
                    'es-419': 'opciones'
                })
                .setDescription('Options separated by commas (e.g., John, Peter, Anna)')
                .setDescriptionLocalizations({
                    'es-ES': 'Opciones separadas por coma (ej: Juan, Pedro, Ana)',
                    'es-419': 'Opciones separadas por coma (ej: Juan, Pedro, Ana)'
                })
                .setRequired(true)),
                
    async execute(interaction) {
        const lang = getLocale(interaction.locale);
        const channelId = interaction.channelId;

        if (activeSpins.has(channelId)) {
            return interaction.reply({ content: lang.alreadySpinning, ephemeral: true });
        }

        const input = interaction.options.getString('options');
        
        const optionsArray = input.split(',')
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0);

        if (optionsArray.length < 2) {
            return interaction.reply({ content: lang.minOptions, ephemeral: true });
        }
        if (optionsArray.length > 20) {
            return interaction.reply({ content: lang.maxOptions, ephemeral: true });
        }

        activeSpins.add(channelId);

        // AQUÍ INYECTAMOS LA LÍNEA QUE FALTABA
        const opcionesTexto = optionsArray.join(', ');
        await interaction.reply({ content: lang.initialSpinning.replace('{options}', opcionesTexto) });

        try {
            const { buffer, winnerName } = await generateSpinGif(optionsArray);
            const attachment = new AttachmentBuilder(buffer, { name: 'ruleta.gif' });
            
            await interaction.editReply({ 
                content: lang.spinning.replace('{options}', opcionesTexto),
                files: [attachment] 
            });

            setTimeout(async () => {
                try {
                    await interaction.followUp({ content: lang.winner.replace('{winner}', winnerName) });
                } catch (e) {
                    console.error('Error al enviar mensaje de ganador:', e);
                } finally {
                    activeSpins.delete(channelId);
                }
            }, 2900);

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: lang.criticalError });
            activeSpins.delete(channelId);
        }
    },
};