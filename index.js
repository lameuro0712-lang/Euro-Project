// ====== TẠO WEB SERVER HTTP THUẦN (KHÔNG CẦN EXPRESS, GIỮ RENDER ONLINE 24/7) ======
const http = require('http');
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Euro đang hoạt động 24/7!\n');
});

server.listen(PORT, () => {
    console.log(`[HTTP] Server giả lập đang chạy trên port ${PORT}`);
});

// ===================================================================================

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
        weights[0].weight *= 0.70; // Game Thủ
        weights[1].weight *= 0.90; // Animator
        weights[2].weight *= 1.10; // Content Creator
        weights[3].weight *= 1.05; // Gambler
        weights[4].weight *= 1.03; // Actor
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

// HÀM VẼ THANH MÁU EMOJI
function getHealthBar(currentHp, maxHp) {
    const totalBlocks = 10;
    const fillBlocks = Math.max(0, Math.min(totalBlocks, Math.round((currentHp / maxHp) * totalBlocks)));
    const emptyBlocks = totalBlocks - fillBlocks;

    const green = '🟩'.repeat(fillBlocks);
    const red = '⬛'.repeat(emptyBlocks);
    return `${green}${red} (${currentHp}/${maxHp} HP)`;
}

// HỆ THỐNG THU THUẾ TỰ ĐỘNG MỖI 6H CHIỀU CHỦ NHẬT
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

                    console.log(`[THU THUẾ] Đã thu 10% thuế tài sản của toàn bộ thành viên vào 18:00 Chủ Nhật!`);
                    
                    try {
                        const guild = client.guilds.cache.first();
                        if (guild) {
                            const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                            if (channel) {
                                const taxEmbed = new EmbedBuilder()
                                    .setTitle(`🏛️ SỞ THUẾ PHÁO ĐÀI - THU THUẾ ĐỊNH KỲ`)
                                    .setColor(0xff5555)
                                    .setDescription(`⏰ Đã đến **18:00 Chủ Nhật**. Sở thuế đã tiến hành thu **10% thuế tài sản** (làm tròn lên) của toàn bộ cư dân trong pháo đài!`)
                                    .setTimestamp();
                                channel.send({ embeds: [taxEmbed] });
                            }
                        }
                    } catch (e) {
                        console.log('Không gửi được thông báo thuế vào kênh chat.');
                    }
                });
            });
        }
    }, 60000);
}

client.once('clientReady', () => {
    console.log(`[BOT ONLINE] Bot ${client.user.tag} đã sẵn sàng chạy!`);
    startTaxScheduler();
});

client.on('messageCreate', async message => {
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
                { name: '⚔️ Đấu trường PvP Turn-Based', value: '`eduel @đối_thủ <số_tiền>` - Thách đấu khô máu!\n• **Thanh Máu (HP):** Máu tối đa = `Lực chiến × 10`\n• **Lựa chọn:** **⚔️ Tấn Công** hoặc **🧪 Hồi Máu** (tối đa 2 lần/trận)\n• **Phần thưởng:** Thắng húp cược + tăng mạnh điểm Lực chiến!', inline: false },
                { name: '💼 Công việc & Cửa hàng', value: '`elamviec` - Nhận lương hoặc tham gia sự kiện công việc\n`eshop` - Mở cửa hàng mua vật phẩm, role và custom role (tự động tạo Ticket & ping Mod/Owner)', inline: false },
                { name: '🎲 Mini-games Cờ bạc', value: '`err <số_tiền>` (hoặc `eroulette`) - Cò Quay Nga sinh tử\n`ebj <số_tiền>` (hoặc `eblackjack`) - Chơi Xì Dách với nhà cái', inline: false },
                { name: '🏆 Bảng xếp hạng', value: '`elb` (hoặc `etop`) - Xem top 10 đại gia giàu nhất pháo đài', inline: false },
                { name: '⚙️ Lệnh Admin', value: '`eadd <số_tiền> @user` - Bơm tiền (Chỉ Admin)\n`eremove <số_tiền> @user` - Thu hồi tiền (Chỉ Admin)', inline: false }
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
                    .setFooter({ text: 'Pháo đài của Euro • Hệ thống chỉ số' })
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
                                    if (err3) {
                                        return i.reply({ content: '❌ Lỗi khi kích hoạt buff!', ephemeral: true });
                                    }

                                    const updatedEmbed = new EmbedBuilder()
                                        .setTitle(`🎒 Túi Đồ & Tài Sản của ${username}`)
                                        .setColor(EMBED_COLOR)
                                        .addFields(
                                            { name: '💰 Số dư Eurix', value: `**${eurix}**${EURIX_EMOJI}`, inline: true },
                                            { name: '💼 Nghề nghiệp', value: `**${job}**`, inline: true },
                                            { name: '⚔️ Lực chiến', value: `**${lucChien.toLocaleString()}** điểm`, inline: true },
                                            { name: '🍀 Luck Boost sở hữu', value: `**${newLuckCount}** cái`, inline: true },
                                            { name: '⚡ Trạng thái Buff', value: `🟢 Đã kích hoạt (**4p 59s** còn lại)`, inline: false }
                                        )
                                        .setTimestamp();

                                    await i.update({
                                        content: '⚡ **Đã kích hoạt Luck Boost thành công!** Buff sẽ kéo dài trong 5 phút.',
                                        embeds: [updatedEmbed],
                                        components: []
                                    }).catch(() => {});

                                    setTimeout(async () => {
                                        try {
                                            const userToDM = await client.users.fetch(userId);
                                            if (userToDM) {
                                                const notifyEmbed = new EmbedBuilder()
                                                    .setTitle('⏳ LUCK BOOST ĐÃ HẾT HẠN!')
                                                    .setColor(0xff4444)
                                                    .setDescription(`Chào **${username}**, **5 phút Luck Boost** của bạn tại **Pháo đài của Euro** đã chính thức kết thúc!\n\n👉 Hãy vào lại kênh cờ bạc gõ \`einv\` để bật cái mới nhé.`)
                                                    .setTimestamp();
                                                await userToDM.send({ embeds: [notifyEmbed] });
                                            }
                                        } catch (dmErr) {}
                                    }, durationMs);

                                });
                            });
                        });
                    });
                }
            });
        });
    }

    // 3. LỆNH PVP / THÁCH ĐẤU TURN-BASED (THANH MÁU & HỒI MÁU): eduel @user <số_tiền>
    else if (content === 'eduel') {
        const targetUser = message.mentions.users.first();
        const bet = parseInt(args[2]);

        if (!targetUser) {
            return message.channel.send('❌ Vui lòng tag người bạn muốn thách đấu! Ví dụ: `eduel @User 500`');
        }
        if (targetUser.id === userId) {
            return message.channel.send('❌ Bạn không thể tự đánh chính mình được!');
        }
        if (targetUser.bot) {
            return message.channel.send('❌ Bạn không thể thách đấu bot!');
        }
        if (isNaN(bet) || bet <= 0) {
            return message.channel.send('❌ Vui lòng nhập số tiền cược hợp lệ muốn thách đấu!');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [userId], async (err, challengerRow) => {
                if (err || !challengerRow || challengerRow.eurix < bet) {
                    closeDb();
                    return message.channel.send(`❌ Bạn không đủ Eurix để cược! Số dư hiện tại: **${challengerRow ? challengerRow.eurix : 0}**${EURIX_EMOJI}.`);
                }

                db.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [targetUser.id], async (err2, targetRow) => {
                    closeDb();
                    const targetEurix = targetRow ? targetRow.eurix : 0;
                    if (targetEurix < bet) {
                        return message.channel.send(`❌ Đối thủ <@${targetUser.id}> không đủ ${bet}${EURIX_EMOJI} để nhận kèo này!`);
                    }

                    const p1LC = challengerRow.lucChien || 100;
                    const p2LC = targetRow ? (targetRow.lucChien || 100) : 100;

                    const duelEmbed = new EmbedBuilder()
                        .setTitle(`⚔️ THÁCH ĐẤU PVP KHÔ MÁU`)
                        .setColor(0xe67e22)
                        .setDescription(
                            `🔥 **${username}** đã thách đấu <@${targetUser.id}> với mức cược **${bet.toLocaleString()}**${EURIX_EMOJI}!\n\n` +
                            `📊 **Sức mạnh ban đầu:**\n` +
                            `• **${username}:** ${p1LC.toLocaleString()} LC\n` +
                            `• **${targetUser.username}:** ${p2LC.toLocaleString()} LC\n\n` +
                            `*👉 <@${targetUser.id}> có 30 giây để chấp nhận hoặc từ chối!*`
                        );

                    const rowButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('duel_accept').setLabel('⚔️ Nghênh Chiến').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('duel_decline').setLabel('🏳️ Xin Hàng').setStyle(ButtonStyle.Danger)
                    );

                    const msg = await message.channel.send({
                        content: `<@${targetUser.id}>`,
                        embeds: [duelEmbed],
                        components: [rowButtons]
                    });

                    const filter = i => i.user.id === targetUser.id;
                    const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

                    collector.on('collect', async i => {
                        if (i.customId === 'duel_decline') {
                            return i.update({
                                embeds: [new EmbedBuilder().setColor(0xff4444).setTitle('🏳️ ĐÃ TỪ CHỐI THÁCH ĐẤU').setDescription(`<@${targetUser.id}> đã hèn nhát từ chối lời thách đấu của **${username}**!`)],
                                components: []
                            });
                        }

                        if (i.customId === 'duel_accept') {
                            const p1MaxHp = p1LC * 10;
                            const p2MaxHp = p2LC * 10;
                            let p1CurrentHp = p1MaxHp;
                            let p2CurrentHp = p2MaxHp;

                            let p1HealCount = 2;
                            let p2HealCount = 2;

                            let currentTurnUserId = userId;
                            let logs = [`🎮 Trận đấu bắt đầu! Tới lượt **${username}** ra chiêu.`];

                            const renderBattleEmbed = () => {
                                const isP1Turn = currentTurnUserId === userId;
                                const activeUser = isP1Turn ? username : targetUser.username;

                                return new EmbedBuilder()
                                    .setTitle(`⚔️ ĐẤU TRƯỜNG PVP — Mức Cược: ${bet.toLocaleString()}${EURIX_EMOJI}`)
                                    .setColor(0x00C851)
                                    .addFields(
                                        { name: `👤 ${username} (${p1LC} LC)`, value: `${getHealthBar(p1CurrentHp, p1MaxHp)}\n🧪 Hồi máu còn lại: **${p1HealCount}** lần`, inline: false },
                                        { name: `👤 ${targetUser.username} (${p2LC} LC)`, value: `${getHealthBar(p2CurrentHp, p2MaxHp)}\n🧪 Hồi máu còn lại: **${p2HealCount}** lần`, inline: false },
                                        { name: '📜 Diễn biến mới nhất:', value: logs.slice(-3).join('\n') || 'Trận đấu vừa bắt đầu!', inline: false }
                                    )
                                    .setFooter({ text: `👉 Lượt hiện tại: ${activeUser}` });
                            };

                            const getBattleButtons = (turnUserId) => {
                                const isP1 = turnUserId === userId;
                                const currentHealCount = isP1 ? p1HealCount : p2HealCount;

                                return [new ActionRowBuilder().addComponents(
                                    new ButtonBuilder().setCustomId('battle_attack').setLabel('⚔️ Tấn Công').setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder().setCustomId('battle_heal').setLabel(`🧪 Hồi Máu (${currentHealCount}/2)`).setStyle(ButtonStyle.Success).setDisabled(currentHealCount <= 0)
                                )];
                            };

                            await i.update({
                                embeds: [renderBattleEmbed()],
                                components: getBattleButtons(currentTurnUserId)
                            });

                            const battleCollector = msg.createMessageComponentCollector({
                                componentType: ComponentType.Button,
                                time: 120000
                            });

                            battleCollector.on('collect', async bInt => {
                                if (bInt.user.id !== currentTurnUserId) {
                                    return bInt.reply({ content: '❌ Chưa tới lượt của bạn! Hãy kiên nhẫn.', ephemeral: true });
                                }

                                const isP1 = currentTurnUserId === userId;
                                const attackerName = isP1 ? username : targetUser.username;
                                const defenderName = isP1 ? targetUser.username : username;

                                if (bInt.customId === 'battle_attack') {
                                    const baseDmg = isP1 ? p1LC : p2LC;
                                    const dmg = Math.floor(baseDmg * (0.8 + Math.random() * 0.5));

                                    if (isP1) {
                                        p2CurrentHp = Math.max(0, p2CurrentHp - dmg);
                                    } else {
                                        p1CurrentHp = Math.max(0, p1CurrentHp - dmg);
                                    }

                                    logs.push(`💥 **${attackerName}** vung đao gây **${dmg}** sát thương lên **${defenderName}**!`);
                                } 
                                else if (bInt.customId === 'battle_heal') {
                                    const maxHp = isP1 ? p1MaxHp : p2MaxHp;
                                    const healAmt = Math.floor(maxHp * 0.35);

                                    if (isP1) {
                                        p1CurrentHp = Math.min(p1MaxHp, p1CurrentHp + healAmt);
                                        p1HealCount--;
                                    } else {
                                        p2CurrentHp = Math.min(p2MaxHp, p2CurrentHp + healAmt);
                                        p2HealCount--;
                                    }

                                    logs.push(`🧪 **${attackerName}** cắn thuốc hồi lại **+${healAmt}** HP!`);
                                }

                                if (p1CurrentHp <= 0 || p2CurrentHp <= 0) {
                                    battleCollector.stop('GAME_OVER');

                                    const isP1Win = p1CurrentHp > 0;
                                    const winnerName = isP1Win ? username : targetUser.username;

                                    const winLcGained = Math.floor(Math.random() * 30) + 20;
                                    const loseLcGained = Math.floor(Math.random() * 15) + 5;

                                    runDbQuery((db2, closeDb2) => {
                                        db2.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [userId], (e1, r1) => {
                                            db2.get(`SELECT eurix, lucChien FROM users WHERE userId = ?`, [targetUser.id], (e2, r2) => {
                                                const cEurix = r1 ? r1.eurix : 0;
                                                const tEurix = r2 ? r2.eurix : 0;
                                                const cLC = r1 ? (r1.lucChien || 100) : 100;
                                                const tLC = r2 ? (r2.lucChien || 100) : 100;

                                                let newCEurix = isP1Win ? cEurix + bet : Math.max(0, cEurix - bet);
                                                let newTEurix = !isP1Win ? tEurix + bet : Math.max(0, tEurix - bet);

                                                let newCLC = isP1Win ? cLC + winLcGained : cLC + loseLcGained;
                                                let newTLC = !isP1Win ? tLC + winLcGained : tLC + loseLcGained;

                                                db2.run(`UPDATE users SET eurix = ?, lucChien = ? WHERE userId = ?`, [newCEurix, newCLC, userId]);
                                                db2.run(`UPDATE users SET eurix = ?, lucChien = ? WHERE userId = ?`, [newTEurix, newTLC, targetUser.id], () => {
                                                    closeDb2();

                                                    const finalEmbed = new EmbedBuilder()
                                                        .setTitle(`👑 KẾT QUẢ ĐẤU TRƯỜNG PVP`)
                                                        .setColor(0x00C851)
                                                        .setDescription(
                                                            `☠️ **${isP1Win ? targetUser.username : username}** đã kiệt sức gục ngã trên sàn đấu!\n\n` +
                                                            `🏆 **Người chiến thắng:** **${winnerName}** (+${bet.toLocaleString()}${EURIX_EMOJI})!\n\n` +
                                                            `📈 **Cập nhật Lực Chiến:**\n` +
                                                            `• **${username}:** ${newCLC.toLocaleString()} LC *(+${isP1Win ? winLcGained : loseLcGained})*\n` +
                                                            `• **${targetUser.username}:** ${newTLC.toLocaleString()} LC *(+${!isP1Win ? winLcGained : loseLcGained})*`
                                                        )
                                                        .addFields({ name: '📜 Nhật ký trận đấu', value: logs.slice(-4).join('\n') });

                                                    bInt.update({ embeds: [finalEmbed], components: [] });
                                                });
                                            });
                                        });
                                    });
                                    return;
                                }

                                currentTurnUserId = isP1 ? targetUser.id : userId;

                                await bInt.update({
                                    embeds: [renderBattleEmbed()],
                                    components: getBattleButtons(currentTurnUserId)
                                });
                            });
                        }
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            msg.edit({ embeds: [new EmbedBuilder().setColor(0xffaa00).setTitle('⏱️ HẾT GIỜ THÁCH ĐẤU').setDescription(`Đối thủ không phản hồi, trận đấu bị hủy tự động.`)], components: [] }).catch(() => {});
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

        if (!targetUser) {
            return message.channel.send('❌ Vui lòng tag người bạn muốn tặng tiền! Ví dụ: `epay @User 100`');
        }
        if (targetUser.id === userId) {
            return message.channel.send('❌ Bạn không thể tự tặng tiền cho chính mình được!');
        }
        if (isNaN(amount) || amount <= 0) {
            return message.channel.send('❌ Vui lòng nhập số tiền hợp lệ muốn tặng!');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err, senderRow) => {
                if (err || !senderRow || senderRow.eurix < amount) {
                    closeDb();
                    return message.channel.send(`❌ Bạn không đủ Eurix để tặng! Số dư hiện tại: **${senderRow ? senderRow.eurix : 0}** ${EURIX_EMOJI}.`);
                }

                db.get(`SELECT eurix FROM users WHERE userId = ?`, [targetUser.id], (err2, receiverRow) => {
                    if (err2) {
                        closeDb();
                        return message.channel.send('❌ Lỗi hệ thống khi xử lý người nhận!');
                    }

                    const newSenderEurix = senderRow.eurix - amount;
                    const receiverCurrentEurix = receiverRow ? receiverRow.eurix : 0;
                    const newReceiverEurix = receiverCurrentEurix + amount;

                    db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newSenderEurix, userId]);

                    db.run(
                        `INSERT OR REPLACE INTO users (userId, eurix, job, lastClaim, luckBoost, lastDaily, activeLuckBoost, lucChien) VALUES (?, ?, COALESCE((SELECT job FROM users WHERE userId = ?), 'Chưa có'), COALESCE((SELECT lastClaim FROM users WHERE userId = ?), 0), COALESCE((SELECT luckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lastDaily FROM users WHERE userId = ?), 0), COALESCE((SELECT activeLuckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`,
                        [targetUser.id, newReceiverEurix, targetUser.id, targetUser.id, targetUser.id, targetUser.id, targetUser.id, targetUser.id],
                        (err3) => {
                            closeDb();
                            if (err3) return message.channel.send('❌ Lỗi khi thực hiện giao dịch!');

                            const embedPay = new EmbedBuilder()
                                .setTitle(`💸 Chuyển Tiền Thành Công`)
                                .setColor(EMBED_COLOR)
                                .setDescription(`**${username}** đã tặng **${amount}**${EURIX_EMOJI} cho **${targetUser.username}**!`)
                                .setTimestamp();
                            return message.channel.send({ embeds: [embedPay] });
                        }
                    );
                });
            });
        });
    }

    // 5. LỆNH ĐIỂM DANH HÀNG NGÀY: edaily
    else if (content === 'edaily') {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const dailyReward = 500;

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                if (err) {
                    closeDb();
                    return message.channel.send('❌ Lỗi kết nối cơ sở dữ liệu!');
                }

                const lastDailyTime = row ? (row.lastDaily || 0) : 0;
                const timeLeft = oneDay - (now - lastDailyTime);

                if (timeLeft > 0) {
                    closeDb();
                    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    return message.channel.send(`⏰ Bạn đã điểm danh hôm nay rồi! Vui lòng quay lại sau **${hoursLeft} giờ ${minutesLeft} phút** nữa nhé.`);
                }

                const currentEurix = row ? row.eurix : 0;
                const newEurix = currentEurix + dailyReward;

                db.run(
                    `INSERT OR REPLACE INTO users (userId, eurix, job, lastClaim, luckBoost, lastDaily, activeLuckBoost, lucChien) VALUES (?, ?, COALESCE((SELECT job FROM users WHERE userId = ?), 'Chưa có'), COALESCE((SELECT lastClaim FROM users WHERE userId = ?), 0), COALESCE((SELECT luckBoost FROM users WHERE userId = ?), 0), ?, COALESCE((SELECT activeLuckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`,
                    [userId, newEurix, userId, userId, userId, now, userId, userId],
                    (err2) => {
                        closeDb();
                        if (err2) return message.channel.send('❌ Lỗi khi nhận thưởng điểm danh!');

                        const embedDaily = new EmbedBuilder()
                            .setTitle(`🎁 Điểm Danh Hàng Ngày Thành Công`)
                            .setColor(0x00C851)
                            .setDescription(`**${username}** đã điểm danh và nhận ngay **+${dailyReward}**${EURIX_EMOJI}!\n\n💰 **Số dư mới:** **${newEurix.toLocaleString()}**${EURIX_EMOJI}`)
                            .setFooter({ text: 'Hẹn gặp lại bạn vào ngày mai!' })
                            .setTimestamp();
                        return message.channel.send({ embeds: [embedDaily] });
                    }
                );
            });
        });
    }

    // 6. LỆNH BẢNG XẾP HẠNG PHÚ HỘ: elb (hoặc etop)
    else if (content === 'elb' || content === 'etop') {
        runDbQuery((db, closeDb) => {
            db.all(`SELECT userId, eurix, job FROM users ORDER BY eurix DESC LIMIT 10`, async (err, rows) => {
                closeDb();
                if (err || !rows) {
                    return message.channel.send('❌ Lỗi khi tải bảng xếp hạng!');
                }

                let desc = '';
                for (let i = 0; i < rows.length; i++) {
                    const r = rows[i];
                    let medal = `**#${i + 1}**`;
                    if (i === 0) medal = '👑 **#1**';
                    else if (i === 1) medal = '🥈 **#2**';
                    else if (i === 2) medal = '🥉 **#3**';

                    let memberName = `<@${r.userId}>`;
                    try {
                        const fetchedUser = await client.users.fetch(r.userId);
                        if (fetchedUser) memberName = fetchedUser.username;
                    } catch (e) {}

                    desc += `${medal} • **${memberName}** — **${r.eurix.toLocaleString()}**${EURIX_EMOJI} *(Nghề: ${r.job || 'Chưa có'})*\n`;
                }

                const embedLeaderboard = new EmbedBuilder()
                    .setTitle(`🏆 BẢNG XẾP HẠNG PHÚ HỘ PHÁO ĐÀI`)
                    .setColor(EMBED_COLOR)
                    .setDescription(desc || 'Chưa có dữ liệu người chơi.')
                    .setFooter({ text: 'Pháo đài của Euro • Top đại gia giàu nhất' })
                    .setTimestamp();

                return message.channel.send({ embeds: [embedLeaderboard] });
            });
        });
    }

    // 7. LỆNH THÊM TIỀN (ADMIN): eadd <số_tiền> @user
    else if (content === 'eadd') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.channel.send('❌ Bạn không có quyền sử dụng lệnh này!');
        }

        const amount = parseInt(args[1]);
        const targetUser = message.mentions.users.first();

        if (isNaN(amount) || amount <= 0 || !targetUser) {
            return message.channel.send('❌ Cách dùng đúng: `eadd <số_tiền> @ngườidùng`');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix FROM users WHERE userId = ?`, [targetUser.id], (err, row) => {
                const currentEurix = row ? row.eurix : 0;
                const newEurix = currentEurix + amount;

                db.run(
                    `INSERT OR REPLACE INTO users (userId, eurix, job, lastClaim, luckBoost, lastDaily, activeLuckBoost, lucChien) VALUES (?, ?, COALESCE((SELECT job FROM users WHERE userId = ?), 'Chưa có'), COALESCE((SELECT lastClaim FROM users WHERE userId = ?), 0), COALESCE((SELECT luckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lastDaily FROM users WHERE userId = ?), 0), COALESCE((SELECT activeLuckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`,
                    [targetUser.id, newEurix, targetUser.id, targetUser.id, targetUser.id, targetUser.id, targetUser.id, targetUser.id],
                    (err2) => {
                        closeDb();
                        if (err2) return message.channel.send('❌ Lỗi khi thêm tiền!');
                        return message.channel.send(`✅ Đã bơm thêm **${amount}**${EURIX_EMOJI} vào tài khoản của **${targetUser.username}**! (Số dư mới: **${newEurix}**${EURIX_EMOJI})`);
                    }
                );
            });
        });
    }

    // 8. LỆNH XOÁ/TRỪ TIỀN (ADMIN): eremove <số_tiền> @user
    else if (content === 'eremove') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.channel.send('❌ Bạn không có quyền sử dụng lệnh này!');
        }

        const amount = parseInt(args[1]);
        const targetUser = message.mentions.users.first();

        if (isNaN(amount) || amount <= 0 || !targetUser) {
            return message.channel.send('❌ Cách dùng đúng: `eremove <số_tiền> @ngườidùng`');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT eurix FROM users WHERE userId = ?`, [targetUser.id], (err, row) => {
                if (err || !row) {
                    closeDb();
                    return message.channel.send('❌ Người dùng này chưa có tài khoản trong database!');
                }

                const newEurix = Math.max(0, row.eurix - amount);

                db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newEurix, targetUser.id], (err2) => {
                    closeDb();
                    if (err2) return message.channel.send('❌ Lỗi khi trừ tiền!');
                    return message.channel.send(`✅ Đã thu hồi **${amount}**${EURIX_EMOJI} từ tài khoản của **${targetUser.username}**! (Số dư còn lại: **${newEurix}**${EURIX_EMOJI})`);
                });
            });
        });
    }

    // 9. LỆNH CỬA HÀNG: eshop
    else if (content === 'eshop') {
        let currentPage = 1;

        const getShopEmbed = (page) => {
            const embed = new EmbedBuilder().setColor(EMBED_COLOR);
            if (page === 1) {
                embed.setImage('https://cdn.discordapp.com/attachments/1543970291477123073/1553036854302089216/image0.gif?ex=6ab7c9c8&is=6ab67848&hm=7e55b94fcbb76e9572637cfe66bbdd3c5300aa7baa54d8975e9564aace78bbeb&');
                embed.setFooter({ text: 'Trang 1/2 • Bấm nút bên dưới để mua hoặc chuyển trang!' });
            } else {
                embed.setImage('https://cdn.discordapp.com/attachments/1536610126830772346/1555527698196078592/image0.gif?backend=b2&ex=6ac0d98f&is=6abf880f&hm=81d871d0579f6ee0288399ca8fd75003b2a4b7f2326a8fcd6bdf1059b13a9cfe&');
                embed.setFooter({ text: 'Trang 2/2 • Bấm nút bên dưới để mua hoặc chuyển trang!' });
            }
            return embed;
        };

        const getShopComponents = (page) => {
            if (page === 1) {
                return [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('shop_limitless').setLabel('Limitless (12k)').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('shop_timeskipper').setLabel('TimeSkipper (25k)').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('shop_counter').setLabel('Counter (10k)').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('shop_reroll').setLabel('Reroll job (3.5k)').setStyle(ButtonStyle.Primary)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('page_next').setLabel('Trang sau ▶').setStyle(ButtonStyle.Success)
                    )
                ];
            } else {
                return [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('shop_luckboost').setLabel('🍀 Luck Boost (8k)').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('shop_lothu').setLabel('👑 Lọ Thủ (15k)').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('shop_customrole').setLabel('🏷️ Custom Role (15k)').setStyle(ButtonStyle.Primary)
                    ),
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('page_prev').setLabel('◀ Trang trước').setStyle(ButtonStyle.Secondary)
                    )
                ];
            }
        };

        const shopMsg = await message.channel.send({ 
            embeds: [getShopEmbed(currentPage)], 
            components: getShopComponents(currentPage) 
        });

        const filter = i => i.user.id === userId;
        const collector = shopMsg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const customId = i.customId;

            if (customId === 'page_next') {
                currentPage = 2;
                await i.update({ embeds: [getShopEmbed(currentPage)], components: getShopComponents(currentPage) });
                return;
            }
            if (customId === 'page_prev') {
                currentPage = 1;
                await i.update({ embeds: [getShopEmbed(currentPage)], components: getShopComponents(currentPage) });
                return;
            }

            runDbQuery((db, closeDb) => {
                db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                    if (err || !row) {
                        closeDb();
                        return i.reply({ content: '❌ Bạn chưa có tài khoản! Hãy gõ `elamviec` trước.', ephemeral: true });
                    }

                    let cost = 0;
                    let itemName = '';

                    if (customId === 'shop_limitless') { cost = PRICES.LIMITLESS; itemName = 'Limitless (<@&' + ROLES.LIMITLESS + '>)'; }
                    else if (customId === 'shop_timeskipper') { cost = PRICES.TIMESKIPPER; itemName = 'TimeSkipper (<@&' + ROLES.TIMESKIPPER + '>)'; }
                    else if (customId === 'shop_counter') { cost = PRICES.COUNTER; itemName = 'Counter (<@&' + ROLES.COUNTER + '>)'; }
                    else if (customId === 'shop_reroll') { cost = PRICES.REROLL; itemName = 'Reroll job'; }
                    else if (customId === 'shop_luckboost') { cost = PRICES.LUCKBOOST; itemName = '🍀 Luck Boost'; }
                    else if (customId === 'shop_lothu') { cost = PRICES.LOTHU; itemName = '👑 Lọ Thủ (<@&' + ROLES.LOTHU + '>)'; }
                    else if (customId === 'shop_customrole') { cost = PRICES.CUSTOMROLE; itemName = '🏷️ Custom Role'; }

                    if (row.eurix < cost) {
                        closeDb();
                        return i.reply({ content: `❌ Bạn không đủ Eurix! Cần **${cost}**${EURIX_EMOJI}, bạn hiện có **${row.eurix}**${EURIX_EMOJI}.`, ephemeral: true });
                    }

                    const newEurix = row.eurix - cost;

                    if (customId === 'shop_reroll') {
                        const isLuckActive = (row.activeLuckBoost || 0) > Date.now();
                        const newJobObj = rollJob(row.luckBoost, isLuckActive);
                        db.run(`UPDATE users SET eurix = ?, job = ? WHERE userId = ?`, [newEurix, newJobObj.name, userId], async () => {
                            closeDb();
                            await i.reply({ content: `🎉 Bạn đã mua **Reroll job** thành công! Đổi sang nghề mới: **${newJobObj.name}** (Lương: ${newJobObj.salary}/h).`, ephemeral: true });
                        });
                    } 
                    else if (customId === 'shop_luckboost') {
                        const newLuck = (row.luckBoost || 0) + 1;
                        db.run(`UPDATE users SET eurix = ?, luckBoost = ? WHERE userId = ?`, [newEurix, newLuck, userId], async () => {
                            closeDb();
                            await i.reply({ content: `🍀 Bạn đã mua thành công **1x Luck Boost** (Giá 8,000 Eurix)! Kiểm tra trong túi đồ (` + '`einv`' + `) để bật nhé.`, ephemeral: true });
                        });
                    } 
                    else if (customId === 'shop_customrole') {
                        db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newEurix, userId], async () => {
                            closeDb();
                            try {
                                const guild = message.guild;
                                const channelName = `ticket-${username}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                                
                                const ticketChannel = await guild.channels.create({
                                    name: channelName,
                                    type: ChannelType.GuildText,
                                    permissionOverwrites: [
                                        {
                                            id: guild.id,
                                            deny: [PermissionFlagsBits.ViewChannel],
                                        },
                                        {
                                            id: userId,
                                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                                        },
                                        {
                                            id: client.user.id,
                                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                                        }
                                    ]
                                });

                                await ticketChannel.permissionOverwrites.create(ROLES.MOD, {
                                    ViewChannel: true,
                                    SendMessages: true,
                                    ReadMessageHistory: true
                                }).catch(() => {});

                                await ticketChannel.permissionOverwrites.create(ROLES.OWNER, {
                                    ViewChannel: true,
                                    SendMessages: true,
                                    ReadMessageHistory: true
                                }).catch(() => {});

                                guild.members.cache.forEach(member => {
                                    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                                        ticketChannel.permissionOverwrites.create(member.id, {
                                            ViewChannel: true,
                                            SendMessages: true,
                                            ReadMessageHistory: true
                                        }).catch(() => {});
                                    }
                                });

                                const ticketEmbed = new EmbedBuilder()
                                    .setTitle(`🏷️ TẠO CUSTOM ROLE THÀNH CÔNG`)
                                    .setColor(0x00C851)
                                    .setDescription(
                                        `Chào <@${userId}>! Bạn đã mua thành công **Custom Role** (15,000 ${EURIX_EMOJI}).\n\n` +
                                        `📌 **Hướng dẫn:** Hãy gửi tên role muốn tạo, mã màu (HEX) hoặc emoji kèm theo vào đây. Đội ngũ quản lý sẽ hỗ trợ bạn!`
                                    )
                                    .setTimestamp();

                                const closeButtonRow = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Đóng Ticket').setStyle(ButtonStyle.Danger)
                                );

                                const pingContent = `<@${userId}> | <@&${ROLES.MOD}> <@&${ROLES.OWNER}>`;

                                const ticketMsg = await ticketChannel.send({
                                    content: pingContent,
                                    embeds: [ticketEmbed],
                                    components: [closeButtonRow]
                                });

                                const ticketCollector = ticketChannel.createMessageComponentCollector({ time: 86400000 });
                                ticketCollector.on('collect', async btnInt => {
                                    if (btnInt.customId === 'close_ticket') {
                                        await btnInt.reply({ content: '🔒 Kênh này sẽ tự động xóa sau 5 giây...' });
                                        setTimeout(() => {
                                            ticketChannel.delete().catch(() => {});
                                        }, 5000);
                                    }
                                });

                                await i.reply({ content: `🎉 Bạn đã mua **Custom Role** thành công! Hệ thống đã tạo một kênh riêng cho bạn tại: <#${ticketChannel.id}>`, ephemeral: true });

                            } catch (channelErr) {
                                console.error(channelErr);
                                await i.reply({ content: `❌ Đã trừ tiền nhưng không thể tự tạo kênh ticket. Vui lòng liên hệ Admin!`, ephemeral: true });
                            }
                        });
                    }
                    else {
                        let roleIdToAssign = '';
                        if (customId === 'shop_limitless') roleIdToAssign = ROLES.LIMITLESS;
                        if (customId === 'shop_timeskipper') roleIdToAssign = ROLES.TIMESKIPPER;
                        if (customId === 'shop_counter') roleIdToAssign = ROLES.COUNTER;
                        if (customId === 'shop_lothu') roleIdToAssign = ROLES.LOTHU;

                        db.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [newEurix, userId], async () => {
                            closeDb();
                            try {
                                const member = await message.guild.members.fetch(userId);
                                if (member && roleIdToAssign) {
                                    await member.roles.add(roleIdToAssign);
                                }
                            } catch (e) {}
                            await i.reply({ content: `🎉 Bạn đã mua thành công role **${itemName}**!`, ephemeral: true });
                        });
                    }
                });
            });
        });
        return;
    }

    // 10. LỆNH LÀM VIỆC: elamviec
    else if (content === 'elamviec') {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                if (err) {
                    closeDb();
                    return message.channel.send('❌ Lỗi kết nối cơ sở dữ liệu!');
                }

                const isLuckActive = row ? ((row.activeLuckBoost || 0) > now) : false;

                if (!row || row.job === 'Chưa có' || !row.job) {
                    const newJobObj = rollJob(row ? row.luckBoost : 0, isLuckActive);
                    const randomJob = newJobObj.name;
                    const salary = newJobObj.salary;
                    
                    db.run(
                        `INSERT OR REPLACE INTO users (userId, eurix, job, lastClaim, luckBoost, lastDaily, activeLuckBoost, lucChien) VALUES (?, COALESCE((SELECT eurix FROM users WHERE userId = ?), 0), ?, ?, COALESCE((SELECT luckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lastDaily FROM users WHERE userId = ?), 0), COALESCE((SELECT activeLuckBoost FROM users WHERE userId = ?), 0), COALESCE((SELECT lucChien FROM users WHERE userId = ?), 100))`,
                        [userId, userId, randomJob, now, userId, userId, userId, userId],
                        (err) => {
                            closeDb();
                            if (err) return message.channel.send('❌ Lỗi khi lưu dữ liệu!');
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `${username} [ ${randomJob} ]`, iconURL: message.author.displayAvatarURL() })
                                .setTitle(`🎉 Nhận Việc Thành Công!`)
                                .setColor(EMBED_COLOR)
                                .setDescription(
                                    `**Số dư:** ${row ? row.eurix : 0} ${EURIX_EMOJI}\n` +
                                    `Cuối cùng sau bao năm thất nghiệp, **${username}** đã tìm được một công việc!\n` +
                                    `**Lương cơ bản:** ${salary} ${EURIX_EMOJI}/giờ` + (isLuckActive ? `\n*(🍀 Luck Boost đang phát huy tác dụng tăng tỉ lệ nghề hiếm!)*` : '')
                                )
                                .setTimestamp();
                            return message.channel.send({ embeds: [embed] });
                        }
                    );
                    return;
                }

                const currentJobName = row.job;
                const jobInfo = JOBS_GACHA.find(j => j.name === currentJobName) || JOBS_GACHA[0];
                const hourlyRate = jobInfo.salary;

                const lastClaimTime = row.lastClaim || 0;
                const elapsedTime = now - lastClaimTime;
                const hoursPassed = Math.floor(elapsedTime / oneHour);
                const actualHours = hoursPassed >= 1 ? hoursPassed : 0;

                if (actualHours === 0) {
                    closeDb();
                    const randomFunnyText = SPAM_FUNNY_SITUATIONS[Math.floor(Math.random() * SPAM_FUNNY_SITUATIONS.length)];
                    const embedNotYet = new EmbedBuilder()
                        .setAuthor({ name: `${username} [ ${currentJobName} ]`, iconURL: message.author.displayAvatarURL() })
                        .setTitle(`Nơi làm việc của ${username}`)
                        .setColor(0xffaa00)
                        .setDescription(
                            `**Số dư:** ${row.eurix.toLocaleString()} ${EURIX_EMOJI}\n\n` +
                            `**Tình trạng công việc:**\n` +
                            `"${randomFunnyText}"\n\n` +
                            `*(⏳ Chưa đủ 1 tiếng để nhận lương)*`
                        )
                        .setFooter({ text: 'Pháo đài của Euro • Hệ thống công việc' });
                    return message.channel.send({ embeds: [embedNotYet] });
                }

                const baseSalary = hourlyRate * actualHours;
                const situation = getRandomSituation(currentJobName);
                let situationMoney = 0;
                let situationDisplayText = situation.text;

                if (situation.type === 'BONUS') {
                    situationMoney = Math.round(baseSalary * (situation.multiplier - 1));
                } 
                else if (situation.type === 'LOSS_PERCENT') {
                    situationMoney = -Math.round(baseSalary * (situation.percent / 100));
                }

                if (situation.type === 'CHOICE') {
                    closeDb();
                    const rowButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('choice_yes').setLabel('Đồng ý').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('choice_no').setLabel('Từ chối').setStyle(ButtonStyle.Danger)
                    );

                    const embedChoice = new EmbedBuilder()
                        .setAuthor({ name: `${username} [ ${currentJobName} ]`, iconURL: message.author.displayAvatarURL() })
                        .setTitle('❓ TÌNH HUỐNG LỰA CHỌN')
                        .setColor(0xe67e22)
                        .setDescription(
                            `**Thu nhập thụ động:** ${baseSalary} ${EURIX_EMOJI} *(Trong ${actualHours} giờ)*\n\n` +
                            `**Tình trạng công việc:**\n` +
                            `"${situation.text}"\n\n` +
                            `*👉 Chọn nút bên dưới trong 30 giây để chốt lương!*`
                        );

                    const msg = await message.channel.send({ embeds: [embedChoice], components: [rowButtons] });

                    const filter = i => i.user.id === userId;
                    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

                    collector.on('collect', async i => {
                        let finalSituationMoney = 0;
                        let resultText = '';

                        if (i.customId === 'choice_yes') {
                            finalSituationMoney = situation.bonus;
                            resultText = `"${situation.yesText}" *(Thưởng: **+${situation.bonus}** ${EURIX_EMOJI})*`;
                        } else {
                            finalSituationMoney = -situation.penalty;
                            resultText = `"${situation.noText}" *(Phạt: **-${situation.penalty}** ${EURIX_EMOJI})*`;
                        }

                        runDbQuery((db2, closeDb2) => {
                            db2.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err2, row2) => {
                                if (err2 || !row2) {
                                    closeDb2();
                                    return;
                                }
                                const totalEarned = Math.max(0, baseSalary + finalSituationMoney);
                                const finalEurix = row2.eurix + totalEarned;
                                const newLastClaim = lastClaimTime + (actualHours * oneHour);

                                db2.run(`UPDATE users SET eurix = ?, lastClaim = ? WHERE userId = ?`, [finalEurix, newLastClaim, userId], async () => {
                                    closeDb2();
                                    const finalEmbed = new EmbedBuilder()
                                        .setColor(EMBED_COLOR)
                                        .setAuthor({ name: `${username} [ ${currentJobName} ]`, iconURL: message.author.displayAvatarURL() })
                                        .setTitle(`Nơi làm việc của ${username}`)
                                        .setDescription(
                                            `**Số dư:** ${finalEurix.toLocaleString()} ${EURIX_EMOJI}\n\n` +
                                            `**Thu nhập thụ động:** ${baseSalary} ${EURIX_EMOJI} *(Trong ${actualHours} giờ)*\n\n` +
                                            `**Tình trạng công việc:**\n` +
                                            `${resultText}\n\n` +
                                            `➔ **Tổng tiền nhận được:** **+${totalEarned}** ${EURIX_EMOJI}`
                                        )
                                        .setFooter({ text: 'Pháo đài của Euro • Hệ thống công việc' });

                                    await i.update({ embeds: [finalEmbed], components: [] });
                                });
                            });
                        });
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            msg.edit({ embeds: [new EmbedBuilder().setColor(EMBED_COLOR).setDescription(`⏱️ Đã hết 30 giây lựa chọn! Hủy bỏ sự kiện công việc.`)], components: [] });
                        }
                    });
                    return;
                }

                const totalEarned = Math.max(0, baseSalary + situationMoney);
                const finalEurix = row.eurix + totalEarned;
                const newLastClaim = lastClaimTime + (actualHours * oneHour);

                db.run(`UPDATE users SET eurix = ?, lastClaim = ? WHERE userId = ?`, [finalEurix, newLastClaim, userId], (err) => {
                    closeDb();
                    if (err) return message.channel.send('❌ Lỗi khi cập nhật lương!');

                    let eventDetail = `"${situationDisplayText}"`;
                    if (situationMoney < 0) {
                        eventDetail += `\n*(Sự cố phạt: **${situationMoney}** ${EURIX_EMOJI})*`;
                    } else if (situationMoney > 0) {
                        eventDetail += `\n*(Khen thưởng: **+${situationMoney}** ${EURIX_EMOJI})*`;
                    }

                    const workEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLOR)
                        .setAuthor({ name: `${username} [ ${currentJobName} ]`, iconURL: message.author.displayAvatarURL() })
                        .setTitle(`Nơi làm việc của ${username}`)
                        .setDescription(
                            `**Số dư:** ${finalEurix.toLocaleString()} ${EURIX_EMOJI}\n\n` +
                            `**Thu nhập thụ động:** ${baseSalary} ${EURIX_EMOJI} *(Trong ${actualHours} giờ)*\n\n` +
                            `**Tình trạng công việc:**\n` +
                            `${eventDetail}\n\n` +
                            `➔ **Tổng tiền nhận được:** **+${totalEarned}** ${EURIX_EMOJI}`
                        )
                        .setFooter({ text: 'Pháo đài của Euro • Hệ thống công việc' });

                    return message.channel.send({ embeds: [workEmbed] });
                });
            });
        });
    }

    // 11. MINIGAME CÒ QUAY NGA: err <số_tiền_cược>
    else if (content === 'eroulette' || content === 'err') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) {
            return message.channel.send('❌ Cú pháp đúng: `err <số_tiền_cược>` (Ví dụ: `err 100`)');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                closeDb();
                if (err || !row || row.eurix < bet) {
                    return message.channel.send(`❌ Bạn không đủ Eurix để chơi! Số dư hiện tại: **${row ? row.eurix : 0}**${EURIX_EMOJI}.`);
                }

                const isLuckActive = (row.activeLuckBoost || 0) > Date.now();
                let chamberSize = 6;
                let bulletPos = Math.floor(Math.random() * chamberSize) + 1; 
                let currentRound = 1;

                const renderRouletteEmbed = (statusMsg, isOver = false, win = false) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`🔫 Cò Quay Nga (Russian Roulette) — Cược: ${bet}${EURIX_EMOJI}` + (isLuckActive ? ' 🍀 [Luck Boost Buff Active]' : ''))
                        .setColor(isOver ? (win ? 0x00C851 : 0xff4444) : 0xe67e22)
                        .setDescription(
                            `👤 **Người chơi:** ${username}\n` +
                            `🤖 **Nhà cái (Bot)**\n\n` +
                            `📌 **Vòng hiện tại:** ${currentRound} / 6\n` +
                            `📝 **Trạng thái:** ${statusMsg}`
                        );
                    return embed;
                };

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('roulette_shoot').setLabel('🎯 Bắn (Kéo cò)').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('roulette_stop').setLabel('💰 Dừng & Rút tiền').setStyle(ButtonStyle.Success)
                );

                const msg = await message.channel.send({
                    embeds: [renderRouletteEmbed('Bạn đi trước. Tới lượt bạn bóp cò!')],
                    components: [actionRow]
                });

                const filter = i => i.user.id === userId;
                const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 45000 });

                collector.on('collect', async i => {
                    if (i.customId === 'roulette_stop') {
                        collector.stop();
                        const bonusMultiplier = 1 + (currentRound * 0.2); 
                        const reward = Math.round(bet * bonusMultiplier);

                        runDbQuery((db2, closeDb2) => {
                            db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                const current = r2 ? r2.eurix : 0;
                                const final = current + reward;
                                db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                    closeDb2();
                                    i.update({
                                        embeds: [renderRouletteEmbed(`🛑 Bạn đã dừng lại an toàn và nhận thưởng **+${reward}**${EURIX_EMOJI}!`, true, true)],
                                        components: []
                                    });
                                });
                            });
                        });
                        return;
                    }

                    if (i.customId === 'roulette_shoot') {
                        let hitBullet = (currentRound === bulletPos);
                        if (hitBullet && isLuckActive && Math.random() < 0.20) {
                            hitBullet = false; 
                        }

                        if (hitBullet) {
                            collector.stop();
                            runDbQuery((db2, closeDb2) => {
                                db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                    const current = r2 ? r2.eurix : 0;
                                    const final = Math.max(0, current - bet);
                                    db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                        closeDb2();
                                        i.update({
                                            embeds: [renderRouletteEmbed(`💥 **ĐOÀNG!** Viên đạn nằm ở ổ số ${bulletPos}. Bạn đã tự bắn trúng mình và mất **-${bet}**${EURIX_EMOJI}! ☠️`, true, false)],
                                            components: []
                                        });
                                    });
                                });
                            });
                            return;
                        }

                        if (currentRound + 1 === bulletPos) {
                            collector.stop();
                            const reward = bet * 2;
                            runDbQuery((db2, closeDb2) => {
                                db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                    const current = r2 ? r2.eurix : 0;
                                    const final = current + reward;
                                    db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                        closeDb2();
                                        i.update({
                                            embeds: [renderRouletteEmbed(`🤖 Nhà cái bóp cò và... 💥 **ĐOÀNG!** Nhà cái dính đạn nổ tung! Bạn chiến thắng và nhận thưởng lớn **+${reward}**${EURIX_EMOJI}! 🎉`, true, true)],
                                            components: []
                                        });
                                    });
                                });
                            });
                            return;
                        }

                        currentRound += 2; 
                        if (currentRound > chamberSize) {
                            collector.stop();
                            const reward = Math.round(bet * 1.5);
                            runDbQuery((db2, closeDb2) => {
                                db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                    const current = r2 ? r2.eurix : 0;
                                    const final = current + reward;
                                    db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                        closeDb2();
                                        i.update({
                                            embeds: [renderRouletteEmbed(`✨ Đã cạn ổ đạn mà không ai chết! Cả hai cùng sống sót. Bạn nhận thưởng hoàn vốn **+${reward}**${EURIX_EMOJI}.`, true, true)],
                                            components: []
                                        });
                                    });
                                });
                            });
                            return;
                        }

                        let extraMsg = isLuckActive ? ' (⚡ Luck Boost giúp bạn né hiểm nguy!)' : '';
                        await i.update({
                            embeds: [renderRouletteEmbed(`Cạch! Nhà cái bóp cò sống sót. Tới lượt bạn ở vòng ${currentRound}${extraMsg}`)],
                            components: [actionRow]
                        });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        msg.edit({ components: [] }).catch(() => {});
                    }
                });
            });
        });
    }

    // 12. MINIGAME XÌ DÁCH BLACKJACK: eblackjack <số_tiền_cược>
    else if (content === 'eblackjack' || content === 'ebj') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) {
            return message.channel.send('❌ Cú pháp đúng: `eblackjack <số_tiền_cược>` (Ví dụ: `eblackjack 100`)');
        }

        runDbQuery((db, closeDb) => {
            db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, row) => {
                closeDb();
                if (err || !row || row.eurix < bet) {
                    return message.channel.send(`❌ Bạn không đủ Eurix để chơi! Số dư hiện tại: **${row ? row.eurix : 0}**${EURIX_EMOJI}.`);
                }

                const isLuckActive = (row.activeLuckBoost || 0) > Date.now();

                const drawCard = () => {
                    const suits = ['♠', '♥', '♦', '♣'];
                    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
                    const suit = suits[Math.floor(Math.random() * suits.length)];
                    const value = values[Math.floor(Math.random() * values.length)];
                    let weight = parseInt(value);
                    if (['J', 'Q', 'K'].includes(value)) weight = 10;
                    if (value === 'A') weight = 11;
                    return { display: `${value}${suit}`, weight };
                };

                const calculateScore = (cards) => {
                    let score = cards.reduce((sum, c) => sum + c.weight, 0);
                    let aces = cards.filter(c => c.display.startsWith('A')).length;
                    while (score > 21 && aces > 0) {
                        score -= 10;
                        aces--;
                    }
                    return score;
                };

                let playerCards = [drawCard(), drawCard()];
                let botCards = [drawCard(), drawCard()];

                if (isLuckActive && calculateScore(playerCards) < 15) {
                    playerCards.push(drawCard());
                }

                const renderBJEmbed = (finished = false, statusText = '') => {
                    const pScore = calculateScore(playerCards);
                    const bScore = calculateScore(botCards);

                    const embed = new EmbedBuilder()
                        .setTitle(`🃏 Bàn Chơi Xì Dách (Blackjack) — Mức cược: ${bet}${EURIX_EMOJI}` + (isLuckActive ? ' 🍀 [Luck Boost Buff Active]' : ''))
                        .setColor(finished ? (statusText.includes('thắng') ? 0x00C851 : 0xff4444) : EMBED_COLOR)
                        .addFields(
                            { name: `👤 Bài của ${username}`, value: `Lá bài: [ ${playerCards.map(c => c.display).join(', ')} ]\nTổng điểm: **${pScore}**`, inline: true },
                            { name: `🤖 Bài của Nhà Cái`, value: finished ? `Lá bài: [ ${botCards.map(c => c.display).join(', ')} ]\nTổng điểm: **${bScore}**` : `Lá bài: [ ${botCards[0].display}, ? ]`, inline: true }
                        );

                    if (finished) {
                        embed.setDescription(`**KẾT QUẢ**: ${statusText}`);
                    } else {
                        embed.setDescription(`Hãy chọn nút bên dưới để tiếp tục lượt chơi của bạn!`);
                    }
                    return embed;
                };

                const rowButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Rút Bài (Hit)').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('bj_stand').setLabel('🛑 Dừng Bài (Stand)').setStyle(ButtonStyle.Danger)
                );

                const bjMsg = await message.channel.send({ 
                    embeds: [renderBJEmbed(false)], 
                    components: [rowButtons] 
                });

                const filter = i => i.user.id === userId;
                const collector = bjMsg.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'bj_hit') {
                        playerCards.push(drawCard());
                        const pScore = calculateScore(playerCards);

                        if (pScore > 21) {
                            collector.stop();
                            runDbQuery((db2, closeDb2) => {
                                db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                    const current = r2 ? r2.eurix : 0;
                                    const final = Math.max(0, current - bet);
                                    db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                        closeDb2();
                                        i.update({ 
                                            embeds: [renderBJEmbed(true, `💥 Bạn bị Quắc (quá 21 điểm)! Thua **-${bet}**${EURIX_EMOJI}. (Số dư mới: **${final}**${EURIX_EMOJI})`)], 
                                            components: [] 
                                        });
                                    });
                                });
                            });
                        } else {
                            await i.update({ embeds: [renderBJEmbed(false)], components: [rowButtons] });
                        }
                    } 
                    else if (i.customId === 'bj_stand') {
                        collector.stop();
                        while (calculateScore(botCards) < 17) {
                            botCards.push(drawCard());
                        }

                        let pScore = calculateScore(playerCards);
                        let bScore = calculateScore(botCards);

                        if (isLuckActive && pScore <= 21 && bScore > 21) {
                            bScore = 22;
                        }

                        let netChange = 0;
                        let resultString = '';

                        if (bScore > 21 || pScore > bScore) {
                            netChange = bet;
                            resultString = `🎉 Bạn chiến thắng nhà cái! Nhận thưởng **+${bet}**${EURIX_EMOJI}!`;
                        } else if (pScore < bScore) {
                            netChange = -bet;
                            resultString = `💸 Nhà cái điểm cao hơn! Bạn thua **-${bet}**${EURIX_EMOJI}.`;
                        } else {
                            netChange = 0;
                            resultString = `🤝 Hòa điểm với nhà cái! Được hoàn lại tiền cược.`;
                        }

                        runDbQuery((db2, closeDb2) => {
                            db2.get(`SELECT eurix FROM users WHERE userId = ?`, [userId], (err2, r2) => {
                                const current = r2 ? r2.eurix : 0;
                                const final = Math.max(0, current + netChange);
                                db2.run(`UPDATE users SET eurix = ? WHERE userId = ?`, [final, userId], () => {
                                    closeDb2();
                                    i.update({ 
                                        embeds: [renderBJEmbed(true, `${resultString} (Số dư mới: **${final}**${EURIX_EMOJI})`)], 
                                        components: [] 
                                    });
                                });
                            });
                        });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        bjMsg.edit({ components: [] }).catch(() => {});
                    }
                });
            });
        });
    }
});

// ==========================================
// KẾT NỐI DISCORD GATEWAY
// ==========================================
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("❌ LỖI NGHIÊM TRỌNG: Biến môi trường DISCORD_TOKEN chưa được cài đặt trên Render!");
} else {
    console.log("⏳ Đang kết nối tới Discord Gateway...");
    client.login(token)
        .then(() => {
            console.log(`✅ BOT ĐÃ LOGIN THÀNH CÔNG! Sáng đèn Online: ${client.user.tag}`);
        })
        .catch(err => {
            console.error("❌ LOGIN THẤT BẠI - Discord từ chối Token:", err.message);
        });
}
