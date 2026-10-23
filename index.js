// ====== TẠO WEB SERVER ĐỂ UPTIMEROBOT PING VÀO ======
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.status(200).send('Bot Euro đang hoạt động 24/7!');
});

app.listen(PORT, () => console.log(`[HTTP] Server đang chạy trên port ${PORT}`));

// ========================================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ComponentType } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Hàm quản lý kết nối Database an toàn tuyệt đối
function runDbQuery(action) {
    const db = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) console.error('Lỗi kết nối Database:', err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        eurix INTEGER DEFAULT 0,
        job TEXT DEFAULT 'Chưa có',
        lastClaim INTEGER DEFAULT 0,
        luckBoost INTEGER DEFAULT 0,
        lastDaily INTEGER DEFAULT 0,
        activeLuckBoost INTEGER DEFAULT 0,
        lucChien INTEGER DEFAULT 100
    )`, () => {
        db.run(`ALTER TABLE users ADD COLUMN luckBoost INTEGER DEFAULT 0`, () => {
            db.run(`ALTER TABLE users ADD COLUMN lastDaily INTEGER DEFAULT 0`, () => {
                db.run(`ALTER TABLE users ADD COLUMN activeLuckBoost INTEGER DEFAULT 0`, () => {
                    db.run(`ALTER TABLE users ADD COLUMN lucChien INTEGER DEFAULT 100`, () => {
                        action(db, () => {
                            db.close((err) => {
                                if (err) console.error('Lỗi khi đóng database:', err.message);
                            });
                        });
                    });
                });
            });
        });
    });
}

const EURIX_EMOJI = '<:Eurix:1556252044820484248>';
const EMBED_COLOR = 0x3ba4ff;

// CẤU HÌNH ID ROLE TRONG SERVER
const ROLES = {
    LIMITLESS: '1536701167785086996',
    TIMESKIPPER: '1536947205611716699',
    COUNTER: '1536978004511563776',
    LOTHU: '1553314784475090996',
    MOD: '1535278962543038464',
    OWNER: '1535265160619499520'
};

// CẤU HÌNH GIÁ CẢ SHOP
const PRICES = {
    LIMITLESS: 12000,
    TIMESKIPPER: 25000,
    COUNTER: 10000,
    REROLL: 3500,
    LUCKBOOST: 8000,
    LOTHU: 15000,
    CUSTOMROLE: 15000
};

const JOBS_GACHA = [
    { name: 'Game Thủ', salary: 5, weight: 50 },
    { name: 'Animator', salary: 10, weight: 30 },
    { name: 'Content Creator', salary: 20, weight: 15 },
    { name: 'Gambler', salary: 50, weight: 4 },
    { name: 'Actor', salary: 100, weight: 1 }
];

function rollJob(luckBoostCount = 0, isLuckActive = false) {
    let weights = JOBS_GACHA.map(j => ({ ...j }));

    if (isLuckActive) {
        weights[0].weight *= 0.70;
        weights[1].weight *= 0.90;
        weights[2].weight *= 1.10;
        weights[3].weight *= 1.05;
        weights[4].weight *= 1.03;
    }

    const totalWeight = weights.reduce((sum, j) => sum + j.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (const job of weights) {
        cumulative += job.weight;
        if (rand < cumulative) return job;
    }
    return weights[0];
}

const WORK_SITUATIONS = {
    'Game Thủ': [
        { type: 'NORMAL', text: 'Tộc trưởng kéo rank xuyên đêm cho sếp, mắt thâm như gấu trúc nhưng được trả đúng lương chuẩn' },
        { type: 'LOSS_PERCENT', percent: 10, text: 'Bạn bị cháy máy vì tải Genshin Impact về' },
        { type: 'BONUS', multiplier: 1.25, text: 'bạn được donate 10 Eurix!' },
        { type: 'CHOICE', text: '1 donater ngẫu nhiên muốn bạn lắc peach cho mọi người xem', yesText: 'Dù hơi mất danh dự nhưng bạn được +30 Eurix!', noText: 'Bạn từ chối vì lòng tự trọng Game Thủ', bonus: 30, penalty: 10 }
    ],
    'Animator': [
        { type: 'NORMAL', text: 'Vẽ xong 1200 frame hoạt hình cho cảnh nhân vật chớp mắt, nhận đủ lương cơ bản.' },
        { type: 'LOSS_PERCENT', percent: 10, text: 'Bạn bị cha sếp quỵt lương sau khi hoàn thành 3600 khung hình' },
        { type: 'BONUS', multiplier: 1.05, text: 'Vẽ lỡ tay đè nhầm layer nhưng đạo diễn khen "nghệ thuật trừu tượng đỉnh cao" và thưởng nóng!' },
        { type: 'CHOICE', text: 'sếp nhờ nhổ giúp cọng lông nách.', yesText: 'Bạn nhổ cực bén, sếp hài lòng và thưởng thêm Eurix', noText: 'Sếp tức giận -15 Eurix của bạn', bonus: 40, penalty: 15 }
    ],
    'Content Creator': [
        { type: 'NORMAL', text: 'Múa quạt review quán ăn lề đường, clip lên xu hướng nhẹ nhàng nhận đúng cát-xê.' },
        { type: 'LOSS_PERCENT', percent: 10, text: 'Làm video drama quên che mặt, pháo đài bị phạt 10% tổng tiền túi để đền bản quyền!' },
        { type: 'BONUS', multiplier: 1.05, text: 'Đang quay clip thì con mèo nhảy vào phá, fan thả tim rần rần nhận bão tài trợ bất ngờ!' },
        { type: 'CHOICE', text: '1 thằng ngẫu nhiên muốn hợp tác với bạn!', yesText: 'bạn và nó hợp tác rất thuận lợi', noText: 'bạn bị hack bay mẹ kênh', bonus: 50, penalty: 50 }
    ],
    'Gambler': [
        { type: 'NORMAL', text: 'Bạn thắng các sòng bạc nhỏ và húp kha khá tiền.' },
        { type: 'LOSS_PERCENT', percent: 20, text: '🔥 **THÀNH VÔ GIA CƯ!** Nợ nần chồng chất, chủ nợ còn xiết nợ làm mất 20% tổng số dư!' },
        { type: 'BONUS', multiplier: 1.05, text: 'Mơ thấy con đề về 67, dậy phang luôn quả đậm gấp 4 lần lương bình thường!' },
        { type: 'CHOICE', text: 'Chủ nợ vây quanh, sếp sòng bảo: "Nhổ sạch lông nách cho ta thì xóa bớt nợ!"', yesText: 'Bạn ra tay dứt khoát! Chủ nợ vui vẻ lì xì thêm', noText: 'Thà chết chứ không hạ mình! Bạn bị đàn em xin nhẹ', bonus: 100, penalty: 50 }
    ],
    'Actor': [
        { type: 'NORMAL', text: 'Đóng vai quần chúng nằm ngửa suốt 8 tiếng ở hiện trường, nhận cát-xê như đồ ăn yêu thích của Tâm Ngọc' },
        { type: 'LOSS_PERCENT', percent: 10, text: 'Diễn ngu quá bị chửi' },
        { type: 'BONUS', multiplier: 3, text: 'bạn diễn quá hay và được thưởng' },
        { type: 'CHOICE', text: 'Đạo diễn ghé tai: "Thêm cảnh nhổ lông nách sếp vào kịch bản nhé, vai diễn này sẽ nâng tầm em!"', yesText: 'Nhập vai xuất thần! Đạo diễn khen ngợi hết lời và thưởng nóng', noText: 'Bạn bỏ vai vì nghệ thuật chân chính, bị cắt hợp đồng phạt', bonus: 150, penalty: 80 }
    ]
};

const SPAM_FUNNY_SITUATIONS = [
    "Thằng nhóc đeo kính áo vàng cùng 1 con chồn màu xanh ghé thăm pháo đài. Nhìn dị vcl",
    "Mấy thằng nhóc trong sân banh cứ vừa đá bóng vừa xếp hình, chả hiểu kiểu gì",
    "Lòi đâu ra một thằng cha ủng hộ Israel đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
    "Lòi đâu ra một con mẹ ủng hộ phát xít đức đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
    "Công viên gần nhà vừa thuê nhân viên dọn nhà vệ sinh mới, ổng làm việc rất hăng say. Hỏi ổng thì mới biết ổng tên Tom Pearl"
];

function getRandomSituation(jobName) {
    const list = WORK_SITUATIONS[jobName] || WORK_SITUATIONS['Game Thủ'];
    const isChoiceRoll = Math.random() < 0.10;

    if (isChoiceRoll) {
        const choiceSituation = list.find(s => s.type === 'CHOICE');
        if (choiceSituation) return choiceSituation;
    }

    const nonChoiceList = list.filter(s => s.type !== 'CHOICE');
    return nonChoiceList[Math.floor(Math.random() * nonChoiceList.length)];
}

function getHealthBar(currentHp, maxHp) {
    const totalBlocks = 10;
    const fillBlocks = Math.max(0, Math.min(totalBlocks, Math.round((currentHp / maxHp) * totalBlocks)));
    const emptyBlocks = totalBlocks - fillBlocks;

    const green = '🟩'.repeat(fillBlocks);
    const red = '⬛'.repeat(emptyBlocks);
    return `${green}${red} (${currentHp}/${maxHp} HP)`;
}

function startTaxScheduler() {
    setInterval(() => {
        const now = new Date();
        const day = now.getDay(); 
        const hours = now.getHours(); 
        const minutes = now.getMinutes();

        if (day === 0 && hours === 18 && minutes === 0) {
            runDbQuery((db, closeDb) => {
                db.all(`SELECT userId, eurix FROM users WHERE eurix > 0`, async (err, rows) => {
                    if (err || !rows) {
                        closeDb();
                        return;
                    }

                    for (const row of rows) {
                        const taxAmount = Math.ceil(row.eurix * 0.10);
                        const newEurix = Math.max(0, row.eurix - taxAmount);
                        db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newEurix, row.userId]);
                    }
                    closeDb();
                    
                    try {
                        const guild = client.guilds.cache.first();
                        if (guild) {
                            const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                            if (channel) {
                                const taxEmbed = new EmbedBuilder()
                                    .setTitle(`🏛️ SỞ THUẾ PHÁO ĐÀI - THU THUẾ ĐỊNH KỲ`)
                                    .setColor(0xff5555)
                                    .setDescription(`⏰ Đã đến **18:00 Chủ Nhật**. Sở thuế đã tiến hành thu **10% thuế tài sản** của toàn bộ cư dân trong pháo đài!`)
                                    .setTimestamp();
                                channel.send({ embeds: [taxEmbed] });
                            }
                        }
                    } catch (e) {}
                });
            });
        }
    }, 60000);
}

client.once('clientReady', () => {
    console.log(`Bot ${client.user.tag} đã sẵn sàng chạy!`);
    startTaxScheduler();
});

client.on('messageCreate', async message => {
    // IN LOG ĐỂ KIỂM TRA MỖI KHI CÓ TIN NHẮN ĐẾN
    console.log(`📩 [${message.channel.name}] ${message.author.tag}: ${message.content}`);

    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/\s+/);
    const content = args[0].toLowerCase();
    const userId = message.author.id;
    const username = message.author.username;

    // 0. LỆNH HƯỚNG DẪN: ehelp
    if (content === 'ehelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle(`📖 HƯỚNG DẪN SỬ DỤNG BOT PHÁO ĐÀI`)
            .setColor(EMBED_COLOR)
            .setDescription(`Chào mừng bạn đến với hệ thống kinh tế & chiến đấu của pháo đài! Dưới đây là danh sách lệnh:`)
            .addFields(
                { name: '💳 Tài chính & Túi đồ', value: '`esodu` - Xem số dư ví, nghề nghiệp và điểm Lực chiến\n`einv` - Kiểm tra túi đồ và bật Luck Boost (5 phút)\n`epay @user <số_tiền>` - Tặng Eurix cho người khác\n`edaily` - Điểm danh nhận thưởng 500 Eurix mỗi ngày', inline: false },
                { name: '⚔️ Đấu trường PvP Turn-Based', value: '`eduel @đối_thủ <số_tiền>` - Thách đấu khô máu!\n• **Thanh Máu (HP):** Máu tối đa = `Lực chiến × 10`\n• **Lựa chọn:** **⚔️ Tấn Công** hoặc **🧪 Hồi Máu** (tối đa 2 lần/trận)', inline: false },
                { name: '💼 Công việc & Cửa hàng', value: '`elamviec` - Nhận lương hoặc tham gia sự kiện công việc\n`eshop` - Mở cửa hàng mua vật phẩm, role và custom role', inline: false },
                { name: '🎲 Mini-games Cờ bạc', value: '`err <số_tiền>` (hoặc `eroulette`) - Cò Quay Nga sinh tử\n`ebj <số_tiền>` (hoặc `eblackjack`) - Chơi Xì Dách với nhà cái', inline: false },
                { name: '🏆 Bảng xếp hạng', value: '`elb` (hoặc `etop`) - Xem top 10 đại gia giàu nhất pháo đài', inline: false }
            )
            .setFooter({ text: 'Pháo đài của Euro • Chúc bạn chơi game vui vẻ!' })
            .setTimestamp();
        return message.channel.send({ embeds: [helpEmbed] });
    }

    // 1. LỆNH XEM SỐ DƯ & LỰC CHIẾN: esodu
    else if (content === 'esodu') {
        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, row) => {
                closeDb();
                if (err) return message.channel.send('❌ Lỗi hệ thống khi kiểm tra số dư!');
                const eurix = row ? row.eurix : 0;
                const job = row ? row.job : 'Chưa có';
                const lucChien = row ? (row.lucChien || 100) : 100;

                const embed = new EmbedBuilder()
                    .setTitle(`💳 Ví & Sức Mạnh của ${username}`)
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: '💰 Số dư Eurix', value: `**${eurix.toLocaleString()}**${EURIX_EMOJI}`, inline: true },
                        { name: '💼 Công việc hiện tại', value: `**${job}**`, inline: true },
                        { name: '⚔️ Lực chiến', value: `**${lucChien.toLocaleString()}** điểm`, inline: false }
                    )
                    .setTimestamp();
                return message.channel.send({ embeds: [embed] });
            });
        });
    }

    // 2. LỆNH TÚI ĐỒ & BẬT LUCK BOOST: einv
    else if (content === 'einv') {
        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                closeDb();
                if (err) return message.channel.send('❌ Lỗi hệ thống khi kiểm tra túi đồ!');
                
                const eurix = row ? row.eurix : 0;
                const luckBoost = row ? (row.luckBoost || 0) : 0;
                const job = row ? (row.job || 'Chưa có') : 'Chưa có';
                const activeLuckBoost = row ? (row.activeLuckBoost || 0) : 0;
                const lucChien = row ? (row.lucChien || 100) : 100;
                const now = Date.now();

                const isLuckActive = activeLuckBoost > now;
                const timeLeft = isLuckActive ? Math.ceil((activeLuckBoost - now) / 1000) : 0;
                const minutesLeft = Math.floor(timeLeft / 60);
                const secondsLeft = timeLeft % 60;

                const embedInv = new EmbedBuilder()
                    .setTitle(`🎒 Túi Đồ & Tài Sản của ${username}`)
                    .setColor(EMBED_COLOR)
                    .addFields(
                        { name: '💰 Số dư Eurix', value: `**${eurix}**${EURIX_EMOJI}`, inline: true },
                        { name: '💼 Nghề nghiệp', value: `**${job}**`, inline: true },
                        { name: '⚔️ Lực chiến', value: `**${lucChien.toLocaleString()}** điểm`, inline: true },
                        { name: '🍀 Luck Boost sở hữu', value: `**${luckBoost}** cái`, inline: true },
                        { name: '⚡ Trạng thái Buff', value: isLuckActive ? `🟢 Đã kích hoạt (**${minutesLeft}p ${secondsLeft}s** còn lại)` : `🔴 Đang tắt`, inline: false }
                    )
                    .setTimestamp();

                const rowButton = new ActionRowBuilder();
                if (luckBoost > 0 && !isLuckActive) {
                    rowButton.addComponents(
                        new ButtonBuilder().setCustomId(`activate_luck_${userId}`).setLabel('⚡ Bật Luck Boost (5 phút)').setStyle(ButtonStyle.Success)
                    );
                }

                const msgOptions = { embeds: [embedInv] };
                if (rowButton.components.length > 0) msgOptions.components = [rowButton];

                const invMsg = await message.channel.send(msgOptions);

                if (rowButton.components.length > 0) {
                    const filter = i => i.customId === `activate_luck_${userId}` && i.user.id === userId;
                    const collector = invMsg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

                    collector.on('collect', async i => {
                        runDbQuery((db2, closeDb2) => {
                            db2.get(`SELECT luckBoost FROM users WHERE userId = ?`, [userId], async (err2, r2) => {
                                if (err2 || !r2 || r2.luckBoost <= 0) {
                                    closeDb2();
                                    return i.reply({ content: '❌ Bạn không còn Luck Boost nào trong túi!', ephemeral: true });
                                }

                                const newLuckCount = r2.luckBoost - 1;
                                const durationMs = 5 * 60 * 1000;
                                const expireTime = Date.now() + durationMs;

                                db2.run(`UPDATE users SET luckBoost = ?, activeLuckBoost = ? WHERE userId = ?`, [newLuckCount, expireTime, userId], async (err3) => {
                                    closeDb2();
                                    if (err3) return i.reply({ content: '❌ Lỗi khi kích hoạt buff!', ephemeral: true });

                                    await i.reply({ content: '⚡ **Đã kích hoạt Luck Boost thành công!** Buff kéo dài trong 5 phút.', ephemeral: true });
                                });
                            });
                        });
                    });
                }
            });
        });
    }

    // 3. LỆNH PVP / THÁCH ĐẤU TURN-BASED: eduel @user <số_tiền>
    else if (content === 'eduel') {
        const targetUser = message.mentions.users.first();
        const bet = parseInt(args[2]);

        if (!targetUser) return message.channel.send('❌ Vui lòng tag người bạn muốn thách đấu! Ví dụ: `eduel @User 500`');
        if (targetUser.id === userId) return message.channel.send('❌ Bạn không thể tự đánh chính mình được!');
        if (targetUser.bot) return message.channel.send('❌ Không thể thách đấu bot!');
        if (isNaN(bet) || bet <= 0) return message.channel.send('❌ Vui lòng nhập số tiền cược hợp lệ!');

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [userId], async (err, challengerRow) => {
                if (err || !challengerRow || challengerRow.eurix < bet) {
                    closeDb();
                    return message.channel.send(`❌ Bạn không đủ Eurix để cược!`);
                }

                db.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [targetUser.id], async (err2, targetRow) => {
                    closeDb();
                    const targetEurix = targetRow ? targetRow.eurix : 0;
                    if (targetEurix < bet) return message.channel.send(`❌ Đối thủ không đủ tiền nhận kèo này!`);

                    const p1LC = challengerRow.lucChien || 100;
                    const p2LC = targetRow ? (targetRow.lucChien || 100) : 100;

                    const duelEmbed = new EmbedBuilder()
                        .setTitle(`⚔️ THÁCH ĐẤU PVP KHÔ MÁU`)
                        .setColor(0xe67e22)
                        .setDescription(`🔥 **${username}** đã thách đấu <@${targetUser.id}> với mức cược **${bet.toLocaleString()}**${EURIX_EMOJI}!\n\n*👉 <@${targetUser.id}> có 30 giây để chấp nhận!*`);

                    const rowButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('duel_accept').setLabel('⚔️ Nghênh Chiến').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('duel_decline').setLabel('🏳️ Từ Chối').setStyle(ButtonStyle.Danger)
                    );

                    const msg = await message.channel.send({ content: `<@${targetUser.id}>`, embeds: [duelEmbed], components: [rowButtons] });

                    const filter = i => i.user.id === targetUser.id;
                    const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

                    collector.on('collect', async i => {
                        if (i.customId === 'duel_decline') {
                            return i.update({ embeds: [new EmbedBuilder().setColor(0xff4444).setTitle('🏳️ ĐÃ TỪ CHỐI').setDescription('Đối thủ đã hèn nhát từ chối!')], components: [] });
                        }

                        if (i.customId === 'duel_accept') {
                            const p1MaxHp = p1LC * 10;
                            const p2MaxHp = p2LC * 10;
                            let p1CurrentHp = p1MaxHp;
                            let p2CurrentHp = p2MaxHp;
                            let p1HealCount = 2, p2HealCount = 2;
                            let currentTurnUserId = userId;
                            let logs = [`🎮 Trận đấu bắt đầu! Tới lượt **${username}** ra chiêu.`];

                            const renderBattleEmbed = () => new EmbedBuilder()
                                .setTitle(`⚔️ ĐẤU TRƯỜNG PVP — Cược: ${bet.toLocaleString()}${EURIX_EMOJI}`)
                                .setColor(0x00C851)
                                .addFields(
                                    { name: `👤 ${username} (${p1LC} LC)`, value: `${getHealthBar(p1CurrentHp, p1MaxHp)}\n🧪 Hồi máu: ${p1HealCount}/2`, inline: false },
                                    { name: `👤 ${targetUser.username} (${p2LC} LC)`, value: `${getHealthBar(p2CurrentHp, p2MaxHp)}\n🧪 Hồi máu: ${p2HealCount}/2`, inline: false },
                                    { name: '📜 Diễn biến:', value: logs.slice(-3).join('\n') }
                                );

                            const getBattleButtons = (turnUserId) => [new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('battle_attack').setLabel('⚔️ Tấn Công').setStyle(ButtonStyle.Danger),
                                new ButtonBuilder().setCustomId('battle_heal').setLabel('🧪 Hồi Máu').setStyle(ButtonStyle.Success)
                            )];

                            await i.update({ embeds: [renderBattleEmbed()], components: getBattleButtons(currentTurnUserId) });

                            const battleCollector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

                            battleCollector.on('collect', async bInt => {
                                if (bInt.user.id !== currentTurnUserId) return bInt.reply({ content: '❌ Chưa tới lượt bạn!', ephemeral: true });

                                const isP1 = currentTurnUserId === userId;
                                const attackerName = isP1 ? username : targetUser.username;

                                if (bInt.customId === 'battle_attack') {
                                    const dmg = Math.floor((isP1 ? p1LC : p2LC) * (0.8 + Math.random() * 0.5));
                                    if (isP1) p2CurrentHp = Math.max(0, p2CurrentHp - dmg);
                                    else p1CurrentHp = Math.max(0, p1CurrentHp - dmg);
                                    logs.push(`💥 **${attackerName}** gây **${dmg}** sát thương!`);
                                } else if (bInt.customId === 'battle_heal') {
                                    if (isP1 && p1HealCount > 0) { p1CurrentHp = Math.min(p1MaxHp, p1CurrentHp + Math.floor(p1MaxHp * 0.35)); p1HealCount--; }
                                    else if (!isP1 && p2HealCount > 0) { p2CurrentHp = Math.min(p2MaxHp, p2CurrentHp + Math.floor(p2MaxHp * 0.35)); p2HealCount--; }
                                    logs.push(`🧪 **${attackerName}** đã hồi máu!`);
                                }

                                if (p1CurrentHp <= 0 || p2CurrentHp <= 0) {
                                    battleCollector.stop('GAME_OVER');
                                    const isP1Win = p1CurrentHp > 0;
                                    runDbQuery((db2, closeDb2) => {
                                        db2.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [userId], (e1, r1) => {
                                            db2.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [targetUser.id], (e2, r2) => {
                                                const cEurix = r1 ? r1.eurix : 0, tEurix = r2 ? r2.eurix : 0;
                                                const cLC = r1 ? (r1.lucChien || 100) : 100, tLC = r2 ? (r2.lucChien || 100) : 100;
                                                
                                                db2.run(`UPDATE users SET eurix = ?, lucChien = ? WHERE userId = ?`, [isP1Win ? cEurix + bet : Math.max(0, cEurix - bet), cLC + 25, userId]);
                                                db2.run(`UPDATE users SET eurix = ?, lucChien = ? WHERE userId = ?`, [!isP1Win ? tEurix + bet : Math.max(0, tEurix - bet), tLC + 25, targetUser.id], () => {
                                                    closeDb2();
                                                    bInt.update({ embeds: [new EmbedBuilder().setTitle('👑 KẾT QUẢ PVP').setDescription(`🏆 **Người thắng:** **${isP1Win ? username : targetUser.username}** húp trọn ${bet}${EURIX_EMOJI}!`)], components: [] });
                                                });
                                            });
                                        });
                                    });
                                    return;
                                }

                                currentTurnUserId = isP1 ? targetUser.id : userId;
                                await bInt.update({ embeds: [renderBattleEmbed()], components: getBattleButtons(currentTurnUserId) });
                            });
                        }
                    });
                });
            });
        });
    }

    // 4. LỆNH TẶNG TIỀN: epay @user <số_tiền>
    else if (content === 'epay') {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!targetUser || isNaN(amount) || amount <= 0) return message.channel.send('❌ Cú pháp: `epay @user <số_tiền>`');
        if (targetUser.id === userId) return message.channel.send('❌ Không thể tự tặng tiền cho chính mình!');

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err, senderRow) => {
                if (err || !senderRow || senderRow.eurix < amount) {
                    closeDb();
                    return message.channel.send('❌ Bạn không đủ Eurix để tặng!');
                }

                db.get(`SELECT eurix FROM users WHERE userId = ?`, [targetUser.id], (err2, receiverRow) => {
                    const newSenderEurix = senderRow.eurix - amount;
                    const newReceiverEurix = (receiverRow ? receiverRow.eurix : 0) + amount;

                    db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newSenderEurix, userId]);
                    db.run(`INSERT OR REPLACE INTO users (userId, eurix, job, lucChien) VALUES (?, ?, COALESCE((SELECT job FROM users WHERE userId = ?), 'Chưa có'), COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`, [targetUser.id, newReceiverEurix, targetUser.id, targetUser.id], () => {
                        closeDb();
                        return message.channel.send(`✅ **${username}** đã tặng thành công **${amount}**${EURIX_EMOJI} cho **${targetUser.username}**!`);
                    });
                });
            });
        });
    }

    // 5. LỆNH ĐIỂM DANH: edaily
    else if (content === 'edaily') {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, row) => {
                const lastDaily = row ? (row.lastDaily || 0) : 0;
                if (now - lastDaily < oneDay) {
                    closeDb();
                    return message.channel.send('⏰ Bạn đã điểm danh hôm nay rồi, hãy quay lại vào ngày mai!');
                }

                const newEurix = (row ? row.eurix : 0) + 500;
                db.run(`INSERT OR REPLACE INTO users (userId, eurix, job, lastDaily, lucChien) VALUES (?, ?, COALESCE((SELECT job FROM users WHERE userId = ?), 'Chưa có'), ?, COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`, [userId, newEurix, userId, now, userId], () => {
                    closeDb();
                    return message.channel.send(`🎁 Điểm danh thành công! Nhận ngay **+500**${EURIX_EMOJI}.`);
                });
            });
        });
    }

    // 6. LỆNH BẢNG XẾP HẠNG: elb / etop
    else if (content === 'elb' || content === 'etop') {
        runDbQuery((db, closeDb) => {
            db.all(`SELECT userId, eurix, job FROM users ORDER BY eurix DESC LIMIT 10`, async (err, rows) => {
                closeDb();
                if (!rows) return message.channel.send('❌ Chưa có dữ liệu bảng xếp hạng.');

                let desc = '';
                for (let i = 0; i < rows.length; i++) {
                    const r = rows[i];
                    desc += `**#${i + 1}** • <@${r.userId}> — **${r.eurix.toLocaleString()}**${EURIX_EMOJI} *(Nghề: ${r.job})*\n`;
                }

                const embed = new EmbedBuilder().setTitle(`🏆 BẢNG XẾP HẠNG PHÚ HỘ`).setColor(EMBED_COLOR).setDescription(desc);
                return message.channel.send({ embeds: [embed] });
            });
        });
    }

    // 7. LỆNH LÀM VIỆC: elamviec
    else if (content === 'elamviec') {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                const isLuckActive = row ? ((row.activeLuckBoost || 0) > now) : false;

                if (!row || !row.job || row.job === 'Chưa có') {
                    const newJobObj = rollJob(row ? row.luckBoost : 0, isLuckActive);
                    db.run(`INSERT OR REPLACE INTO users (userId, eurix, job, lastClaim, lucChien) VALUES (?, COALESCE((SELECT eurix FROM users WHERE userId = ?), 0), ?, ?, COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`, [userId, userId, newJobObj.name, now, userId], () => {
                        closeDb();
                        return message.channel.send(`🎉 Chúc mừng bạn gacha thành công nghề: **${newJobObj.name}**! Gõ lại \`elamviec\` sau để nhận lương.`);
                    });
                    return;
                }

                const hoursPassed = Math.floor((now - (row.lastClaim || 0)) / oneHour);
                if (hoursPassed < 1) {
                    closeDb();
                    return message.channel.send(`⏳ Chưa đủ 1 tiếng để nhận lương! Tình trạng: *"${SPAM_FUNNY_SITUATIONS[Math.floor(Math.random() * SPAM_FUNNY_SITUATIONS.length)]}"*`);
                }

                const jobInfo = JOBS_GACHA.find(j => j.name === row.job) || JOBS_GACHA[0];
                const baseSalary = jobInfo.salary * hoursPassed;
                const finalEurix = row.eurix + baseSalary;
                const newLastClaim = (row.lastClaim || now) + (hoursPassed * oneHour);

                db.run(`UPDATE users SET eurix = ?, lastClaim = ? WHERE userId = ?`, [finalEurix, newLastClaim, userId], () => {
                    closeDb();
                    return message.channel.send(`💼 Bạn đã làm việc ${hoursPassed} giờ với nghề **${row.job}** và nhận được **+${baseSalary}**${EURIX_EMOJI}!`);
                });
            });
        });
    }

    // 8. MINIGAME CÒ QUAY NGA: err <số_tiền>
    else if (content === 'eroulette' || content === 'err') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) return message.channel.send('❌ Cú pháp đúng: `err <số_tiền_cược>`');

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                closeDb();
                if (!row || row.eurix < bet) return message.channel.send('❌ Bạn không đủ Eurix để chơi!');

                const bulletPos = Math.floor(Math.random() * 6) + 1;
                const isDead = bulletPos === 1;

                const newEurix = isDead ? Math.max(0, row.eurix - bet) : row.eurix + bet;
                db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newEurix, userId], () => {
                    if (isDead) {
                        return message.channel.send(`💥 **ĐOÀNG!** Bạn đã tự bắn trúng đạn và mất **-${bet}**${EURIX_EMOJI}!`);
                    } else {
                        return message.channel.send(`🎉 Thoát nạn! Bạn bóp cò an toàn và húp được **+${bet}**${EURIX_EMOJI}!`);
                    }
                });
            });
        });
    }

    // 9. MINIGAME XÌ DÁCH: ebj <số_tiền>
    else if (content === 'eblackjack' || content === 'ebj') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) return message.channel.send('❌ Cú pháp đúng: `ebj <số_tiền_cược>`');

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                closeDb();
                if (!row || row.eurix < bet) return message.channel.send('❌ Bạn không đủ tiền cược!');

                const pScore = Math.floor(Math.random() * 6) + 16; // 16-21 điểm
                const bScore = Math.floor(Math.random() * 6) + 15; // 15-20 điểm

                let net = pScore > bScore ? bet : -bet;
                const finalEurix = Math.max(0, row.eurix + net);

                db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [finalEurix, userId], () => {
                    if (net > 0) return message.channel.send(`🃏 **Xì Dách:** Bài bạn (${pScore} điểm) lớn hơn nhà cái (${bScore} điểm)! Thắng **+${bet}**${EURIX_EMOJI}.`);
                    return message.channel.send(`🃏 **Xì Dách:** Bài bạn (${pScore} điểm) thua nhà cái (${bScore} điểm)! Mất **-${bet}**${EURIX_EMOJI}.`);
                });
            });
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
