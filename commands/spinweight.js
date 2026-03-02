const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { generateWeightedSpinGif } = require('../services/spinAnimation.js');
const en = require('../locales/en.json');
const es = require('../locales/es.json');

const activeSpins = new Set();

function getLocale(localeString) {
    if (localeString && localeString.startsWith('es')) return es;
    return en;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spinweight')
        .setNameLocalizations({
            'es-ES': 'spinweight',
            'es-419': 'spinweight'
        })
        .setDescription('Spin the wheel with weighted options')
        .setDescriptionLocalizations({
            'es-ES': 'Gira la ruleta con opciones ponderadas (pesos)',
            'es-419': 'Gira la ruleta con opciones ponderadas (pesos)'
        })
        .addStringOption(option =>
            option.setName('options')
                .setNameLocalizations({
                    'es-ES': 'opciones',
                    'es-419': 'opciones'
                })
                .setDescription('Example: Anna 5, Peter 4, Mary 2')
                .setDescriptionLocalizations({
                    'es-ES': 'Ejemplo: Ana 5, Pedro 4, Maria 2',
                    'es-419': 'Ejemplo: Ana 5, Pedro 4, Maria 2'
                })
                .setRequired(true)),
                
    async execute(interaction) {
        const lang = getLocale(interaction.locale);
        const channelId = interaction.channelId;

        if (activeSpins.has(channelId)) {
            return interaction.reply({ content: lang.alreadySpinning, ephemeral: true });
        }

        const input = interaction.options.getString('options');
        const optionsArray = input.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (optionsArray.length < 2) {
            return interaction.reply({ content: lang.minOptions, ephemeral: true });
        }

        const parsedOptions = [];
        for (const opt of optionsArray) {
            const parts = opt.split(' ');
            const weightStr = parts.pop();
            const weight = parseFloat(weightStr);
            
            if (isNaN(weight) || weight <= 0) {
                return interaction.reply({ content: lang.formatError.replace('{opt}', opt), ephemeral: true });
            }
            
            const name = parts.join(' ').trim() || 'Desconocido';
            parsedOptions.push({ name, weight });
        }

        activeSpins.add(channelId);
        await interaction.reply({ content: lang.calculating });

        try {
            const { buffer, winnerName } = await generateWeightedSpinGif(parsedOptions);
            const attachment = new AttachmentBuilder(buffer, { name: 'ruletapesos.gif' });
            
            const totalWeight = parsedOptions.reduce((sum, opt) => sum + opt.weight, 0);
            
            const resultadosConPorcentaje = parsedOptions.map(opt => {
                const porcentaje = ((opt.weight / totalWeight) * 100).toFixed(1).replace('.0', '');
                return `${opt.name} (${porcentaje}%)`;
            }).join(', ');

            await interaction.editReply({ 
                content: lang.spinning.replace('{options}', resultadosConPorcentaje),
                files: [attachment] 
            });

            setTimeout(async () => {
                try {
                    await interaction.followUp({ content: lang.winner.replace('{winner}', winnerName) });
                } catch (e) {
                    console.error(e);
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