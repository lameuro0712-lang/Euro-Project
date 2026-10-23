// index.js - BẢN FIX TRIỆT ĐỂ KHỞI ĐỘNG BOT
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { getUser } = require('./database');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const CRIME_ROLE_ID = "1536004180555333803";
const EMOJI_EURIX = "<:Eurix:1563134915346698331>";

const activeRouletteGames = new Map();
const activeBlackjackGames = new Map();

client.once('ready', () => {
    console.log(`🤖 Bot Eurix đã sẵn sàng phục vụ Pháo Đài của Euro! Tag: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    // IN RA LOG MỖI KHI CÓ TIN NHẮN TỚI (Dù là từ ai hay kênh nào)
    console.log(`📩 [${message.channel.name}] ${message.author.tag}: ${message.content}`);

    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;

    // Chuyển toàn bộ tin nhắn thành chữ thường để so sánh
    const fullText = message.content.trim().toLowerCase();
    const args = fullText.split(/ +/);
    const command = args[0];

    const user = getUser(message.author.id);
    const memberName = message.author.username;

    // ================= 1. HỆ THỐNG LÀM VIỆC (elamviec) =================
    if (command === 'elamviec') {
        console.log(`⚡ Đang xử lý lệnh elamviec cho ${memberName}...`);
        const now = Date.now();
        const oneHour = 3600 * 1000;

        if (!user.job) {
            let roll = Math.random() * 100;
            if (user.luckboostExpiry > now) roll -= 5;

            if (roll < 40) user.job = "Game Thủ";
            else if (roll < 75) user.job = "Animator";
            else if (roll < 95) user.job = "Content Creator";
            else user.job = "Actor";

            user.lastWorkTime = now;

            const embedNew = new EmbedBuilder()
                .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`Khởi đầu sự nghiệp của ${memberName}`)
                .setDescription(`🎉 Bạn đã gacha thành công và nhận nghề: **${user.job}**!\nHãy dùng lại lệnh \`elamviec\` sau để tích lũy và nhận lương.`)
                .setColor(0x5865F2)
                .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

            return message.reply({ embeds: [embedNew] });
        }

        const timePassed = now - user.lastWorkTime;
        const hoursStacked = Math.floor(timePassed / oneHour);

        if (hoursStacked < 1) {
            if (Math.random() < 0.3) {
                const penalty = 10;
                user.balance = Math.max(0, user.balance - penalty);

                const embedPen = new EmbedBuilder()
                    .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                    .setTitle(`Nơi làm việc của ${memberName}`)
                    .setDescription(`⚠️ **Bạn đang trong thời gian nghỉ ngơi mà cố gượng làm việc!**\nBạn bị kiệt sức và phạt trừ **-${penalty} ${EMOJI_EURIX}**.\n\n**Số dư còn lại:** ${user.balance} ${EMOJI_EURIX}`)
                    .setColor(0xED4245)
                    .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

                return message.reply({ embeds: [embedPen] });
            } else {
                const fortressSituations = [
                    "🏰 1 thằng nhóc đeo kính áo vàng cùng 1 con chồn màu xanh ghé thăm pháo đài. Nhìn dị vcl!",
                    "🏰 Mấy thằng nhóc trong sân banh cứ vừa đá bóng vừa xếp hình rồi lẩm bẩm về việc đá bóng bằng cả tính mạng, chả hiểu kiểu gì.",
                    "🏰 Lòi đâu ra một thằng cha ủng hộ Israel đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Lòi đâu ra một con mẹ ủng hộ phát xít đức đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Công viên gần nhà vừa thuê nhân viên dọn nhà vệ sinh mới, ổng làm việc rất hăng say, nhà vệ sinh nào ổng dọn cũng sạch bong kin kít. Hỏi ổng thì mới biết ổng tên Tom Pearl."
                ];
                const sitText = fortressSituations[Math.floor(Math.random() * fortressSituations.length)];

                const embedFort = new EmbedBuilder()
                    .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                    .setTitle(`Tình Trạng Pháo Đài`)
                    .setDescription(`${sitText}\n\n*(Chưa đủ 1 giờ để nhận lương, hãy quay lại sau!)*`)
                    .setColor(0xFEE75C)
                    .setFooter({ text: "Pháo đài của Euro • Tình huống giải trí" });

                return message.reply({ embeds: [embedFort] });
            }
        }

        let hourlyRate = 5;
        if (user.job === "Animator") hourlyRate = 10;
        else if (user.job === "Content Creator") hourlyRate = 15;
        else if (user.job === "Actor") hourlyRate = 30;

        const baseSalary = hourlyRate * hoursStacked;
        let situationTitle = "Ca làm việc bình thường";
        let situationReward = 0;
        let situationRoll = Math.random() * 100;

        if (user.job === "Game Thủ") {
            if (situationRoll < 20) { situationTitle = '"1 donater ngẫu nhiên muốn bạn lắc peach cho mọi người xem. Bạn đồng ý!"'; situationReward = 10; }
            else if (situationRoll < 60) { situationTitle = '"Stream mượt mà, không gặp sự cố nào"'; situationReward = 0; }
            else if (situationRoll < 80) { situationTitle = '"Bạn bị cháy máy vì tải Genshin Impact về"'; situationReward = -5; }
            else { situationTitle = '"Bạn bất ngờ được fan cứng donate khủng!"'; situationReward = 50; }
        } else if (user.job === "Animator") {
            if (situationRoll < 25) { situationTitle = '"Sếp nhờ nhổ giúp cọng lông nách. Sếp cảm ơn bạn rất nhiều!"'; situationReward = 12; }
            else if (situationRoll < 50) { 
                const fine = Math.floor(user.balance * 0.1);
                situationTitle = '"Sếp nổi giận và trừ 10% số tiền của bạn"'; situationReward = -fine; 
            }
            else if (situationRoll < 75) { situationTitle = '"Bạn bị sếp quỵt lương sau khi làm 3600 frame hoạt hình"'; situationReward = -10; }
            else { situationTitle = '"Bạn vẽ xong 1 tập phim hoạt hình và nó rất thành công!"'; situationReward = 35; }
        } else if (user.job === "Content Creator") {
            if (situationRoll < 30) {
                if (Math.random() < 0.2) { situationTitle = '"Một người ngẫu nhiên hợp tác với bạn. Bạn hợp tác rất thuận lợi!"'; situationReward = 30; }
                else { situationTitle = '"Bạn nhận lời hợp tác nhưng bị hack bay mất kênh!"'; situationReward = -20; }
            } else if (situationRoll < 65) { situationTitle = '"Bạn làm video mệt ỉa nhưng chỉ được 200 view"'; situationReward = -15; }
            else { situationTitle = '"Video của bạn đạt xu hướng và Viral khắp cõi mạng!"'; situationReward = 20; }
        } else if (user.job === "Actor") {
            if (situationRoll < 30) {
                if (Math.random() < 0.4) { situationTitle = '"Được mời đóng quảng cáo và quảng cáo đó thành công vcl!"'; situationReward = 80; }
                else { 
                    const fine = Math.floor(user.balance * 0.1);
                    situationTitle = '"Bạn nhận lời đóng quảng cáo nhưng bị dắt sang Campuchia!"'; situationReward = -fine; 
                }
            } else if (situationRoll < 65) { situationTitle = '"Bộ phim bạn đóng dở ẹc và khán giả quay ra công kích bạn"'; situationReward = -50; }
            else { situationTitle = '"Bộ phim bạn đóng nổi tiếng toàn thế giới!"'; situationReward = 60; }
        }

        const totalEarned = baseSalary + situationReward;
        user.balance = Math.max(0, user.balance + totalEarned);
        user.lastWorkTime = now;

        const rewardFormat = situationReward >= 0 ? `+${situationReward}` : `${situationReward}`;

        const embedJob = new EmbedBuilder()
            .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`Nơi làm việc của ${memberName}`)
            .addFields(
                { name: "Số dư:", value: `${user.balance} ${EMOJI_EURIX}`, inline: false },
                { name: "Thu nhập thụ động:", value: `${baseSalary} ${EMOJI_EURIX} *(Trong ${hoursStacked} giờ)*`, inline: false },
                { name: "Tình trạng công việc:", value: `${situationTitle}\n*(Khen thưởng/Phạt: ${rewardFormat} ${EMOJI_EURIX})*`, inline: false },
                { name: "➔ Tổng tiền nhận được:", value: `**+${totalEarned}** ${EMOJI_EURIX}`, inline: false }
            )
            .setColor(0x57F287)
            .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

        return message.reply({ embeds: [embedJob] });
    }
});

    // ================= 1. HỆ THỐNG LÀM VIỆC (elamviec) =================
    if (command === 'elamviec') {
        const now = Date.now();
        const oneHour = 3600 * 1000;

        if (!user.job) {
            let roll = Math.random() * 100;
            if (user.luckboostExpiry > now) roll -= 5;

            if (roll < 40) user.job = "Game Thủ";
            else if (roll < 75) user.job = "Animator";
            else if (roll < 95) user.job = "Content Creator";
            else user.job = "Actor";

            user.lastWorkTime = now;

            const embedNew = new EmbedBuilder()
                .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                .setTitle(`Khởi đầu sự nghiệp của ${memberName}`)
                .setDescription(`🎉 Bạn đã gacha thành công và nhận nghề: **${user.job}**!\nHãy dùng lại lệnh \`elamviec\` sau để tích lũy và nhận lương.`)
                .setColor(0x5865F2)
                .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

            return message.reply({ embeds: [embedNew] });
        }

        const timePassed = now - user.lastWorkTime;
        const hoursStacked = Math.floor(timePassed / oneHour);

        if (hoursStacked < 1) {
            if (Math.random() < 0.3) {
                const penalty = 10;
                user.balance = Math.max(0, user.balance - penalty);

                const embedPen = new EmbedBuilder()
                    .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                    .setTitle(`Nơi làm việc của ${memberName}`)
                    .setDescription(`⚠️ **Bạn đang trong thời gian nghỉ ngơi mà cố gượng làm việc!**\nBạn bị kiệt sức và phạt trừ **-${penalty} ${EMOJI_EURIX}**.\n\n**Số dư còn lại:** ${user.balance} ${EMOJI_EURIX}`)
                    .setColor(0xED4245)
                    .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

                return message.reply({ embeds: [embedPen] });
            } else {
                const fortressSituations = [
                    "🏰 1 thằng nhóc đeo kính áo vàng cùng 1 con chồn màu xanh ghé thăm pháo đài. Nhìn dị vcl!",
                    "🏰 Mấy thằng nhóc trong sân banh cứ vừa đá bóng vừa xếp hình rồi lẩm bẩm về việc đá bóng bằng cả tính mạng, chả hiểu kiểu gì.",
                    "🏰 Lòi đâu ra một thằng cha ủng hộ Israel đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Lòi đâu ra một con mẹ ủng hộ phát xít đức đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Công viên gần nhà vừa thuê nhân viên dọn nhà vệ sinh mới, ổng làm việc rất hăng say, nhà vệ sinh nào ổng dọn cũng sạch bong kin kít. Hỏi ổng thì mới biết ổng tên Tom Pearl."
                ];
                const sitText = fortressSituations[Math.floor(Math.random() * fortressSituations.length)];

                const embedFort = new EmbedBuilder()
                    .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
                    .setTitle(`Tình Trạng Pháo Đài`)
                    .setDescription(`${sitText}\n\n*(Chưa đủ 1 giờ để nhận lương, hãy quay lại sau!)*`)
                    .setColor(0xFEE75C)
                    .setFooter({ text: "Pháo đài của Euro • Tình huống giải trí" });

                return message.reply({ embeds: [embedFort] });
            }
        }

        let hourlyRate = 5;
        if (user.job === "Animator") hourlyRate = 10;
        else if (user.job === "Content Creator") hourlyRate = 15;
        else if (user.job === "Actor") hourlyRate = 30;

        const baseSalary = hourlyRate * hoursStacked;
        let situationTitle = "Ca làm việc bình thường";
        let situationReward = 0;
        let situationRoll = Math.random() * 100;

        if (user.job === "Game Thủ") {
            if (situationRoll < 20) { situationTitle = '"1 donater ngẫu nhiên muốn bạn lắc peach cho mọi người xem. Bạn đồng ý!"'; situationReward = 10; }
            else if (situationRoll < 60) { situationTitle = '"Stream mượt mà, không gặp sự cố nào"'; situationReward = 0; }
            else if (situationRoll < 80) { situationTitle = '"Bạn bị cháy máy vì tải Genshin Impact về"'; situationReward = -5; }
            else { situationTitle = '"Bạn bất ngờ được fan cứng donate khủng!"'; situationReward = 50; }
        } else if (user.job === "Animator") {
            if (situationRoll < 25) { situationTitle = '"Sếp nhờ nhổ giúp cọng lông nách. Sếp cảm ơn bạn rất nhiều!"'; situationReward = 12; }
            else if (situationRoll < 50) { 
                const fine = Math.floor(user.balance * 0.1);
                situationTitle = '"Sếp nổi giận và trừ 10% số tiền của bạn"'; situationReward = -fine; 
            }
            else if (situationRoll < 75) { situationTitle = '"Bạn bị sếp quỵt lương sau khi làm 3600 frame hoạt hình"'; situationReward = -10; }
            else { situationTitle = '"Bạn vẽ xong 1 tập phim hoạt hình và nó rất thành công!"'; situationReward = 35; }
        } else if (user.job === "Content Creator") {
            if (situationRoll < 30) {
                if (Math.random() < 0.2) { situationTitle = '"Một người ngẫu nhiên hợp tác với bạn. Bạn hợp tác rất thuận lợi!"'; situationReward = 30; }
                else { situationTitle = '"Bạn nhận lời hợp tác nhưng bị hack bay mất kênh!"'; situationReward = -20; }
            } else if (situationRoll < 65) { situationTitle = '"Bạn làm video mệt ỉa nhưng chỉ được 200 view"'; situationReward = -15; }
            else { situationTitle = '"Video của bạn đạt xu hướng và Viral khắp cõi mạng!"'; situationReward = 20; }
        } else if (user.job === "Actor") {
            if (situationRoll < 30) {
                if (Math.random() < 0.4) { situationTitle = '"Được mời đóng quảng cáo và quảng cáo đó thành công vcl!"'; situationReward = 80; }
                else { 
                    const fine = Math.floor(user.balance * 0.1);
                    situationTitle = '"Bạn nhận lời đóng quảng cáo nhưng bị dắt sang Campuchia!"'; situationReward = -fine; 
                }
            } else if (situationRoll < 65) { situationTitle = '"Bộ phim bạn đóng dở ẹc và khán giả quay ra công kích bạn"'; situationReward = -50; }
            else { situationTitle = '"Bộ phim bạn đóng nổi tiếng toàn thế giới!"'; situationReward = 60; }
        }

        const totalEarned = baseSalary + situationReward;
        user.balance = Math.max(0, user.balance + totalEarned);
        user.lastWorkTime = now;

        const rewardFormat = situationReward >= 0 ? `+${situationReward}` : `${situationReward}`;

        const embedJob = new EmbedBuilder()
            .setAuthor({ name: `${memberName} [ ${user.job} ]`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`Nơi làm việc của ${memberName}`)
            .addFields(
                { name: "Số dư:", value: `${user.balance} ${EMOJI_EURIX}`, inline: false },
                { name: "Thu nhập thụ động:", value: `${baseSalary} ${EMOJI_EURIX} *(In ${hoursStacked} giờ)*`, inline: false },
                { name: "Tình trạng công việc:", value: `${situationTitle}\n*(Khen thưởng/Phạt: ${rewardFormat} ${EMOJI_EURIX})*`, inline: false },
                { name: "➔ Tổng tiền nhận được:", value: `**+${totalEarned}** ${EMOJI_EURIX}`, inline: false }
            )
            .setColor(0x57F287)
            .setFooter({ text: "Pháo đài của Euro • Hệ thống công việc" });

        return message.reply({ embeds: [embedJob] });
    }

    // ================= 2. CÒ QUAY NGA (err) =================
    if (command === 'err' || command === 'eroulette') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0 || bet > 100) {
            return message.reply("⚠️ Tiền cược không hợp lệ! Giới hạn cược từ **1 đến 100 Eurix**.");
        }
        if (user.balance < bet) {
            return message.reply("⚠️ Bạn không đủ tiền Eurix để đặt cược!");
        }

        if (activeRouletteGames.has(message.author.id)) {
            return message.reply("⚠️ Bạn đang trong một ván Cò Quay Nga rồi!");
        }

        const game = {
            bet: bet,
            bulletIndex: Math.floor(Math.random() * 6),
            currentIndex: 0
        };
        activeRouletteGames.set(message.author.id, game);

        const embedStart = new EmbedBuilder()
            .setTitle("🔫 Cò Quay Nga (Russian Roulette)")
            .setDescription(`**Tiền cược:** ${bet} ${EMOJI_EURIX}\nỔ đạn gồm **6 viên** với **1 viên đạn thật**.\nĐến lượt của **bạn**! Hãy bấm nút bên dưới để bóp cò nhắm vào bản thân.`)
            .setColor(0xED4245)
            .setFooter({ text: "Thắng nhận x1.25 tiền cược | Bị bắn chết mất sạch cược" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rr_shoot').setLabel('💥 Bóp cò vào đầu').setStyle(ButtonStyle.Danger)
        );

        return message.reply({ embeds: [embedStart], components: [row] });
    }

    // ================= 3. XÌ DÁCH (ebj) =================
    if (command === 'ebj' || command === 'eblackjack') {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0 || bet > 50) {
            return message.reply("⚠️ Tiền cược Xì Dách giới hạn tối đa **50 Eurix**!");
        }
        if (user.balance < bet) {
            return message.reply("⚠️ Bạn không đủ Eurix để chơi!");
        }

        if (activeBlackjackGames.has(message.author.id)) {
            return message.reply("⚠️ Bạn đang có một ván Xì dách dở dang!");
        }

        const deck = createDeck();
        const playerHand = [drawCard(deck), drawCard(deck)];
        const botHand = [drawCard(deck), drawCard(deck)];

        const game = { bet, deck, playerHand, botHand };
        activeBlackjackGames.set(message.author.id, game);

        const playerScore = calculateScore(playerHand);

        const embedBj = new EmbedBuilder()
            .setTitle("🃏 Xì Dách (Blackjack)")
            .addFields(
                { name: "Bài của bạn:", value: `${formatHand(playerHand)} (Tổng điểm: **${playerScore}**)`, inline: false },
                { name: "Bài của Nhà Cái (Bot):", value: `${botHand[0].rank}${botHand[0].suit} | 🎴 [Lật úp]`, inline: false }
            )
            .setColor(0x3498DB)
            .setFooter({ text: `Tiền cược: ${bet} Eurix • Quá 21 điểm là Hoắc (Thua)` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Rút Bài (Hit)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bj_stand').setLabel('🛑 Dừng Bài (Stand)').setStyle(ButtonStyle.Success)
        );

        return message.reply({ embeds: [embedBj], components: [row] });
    }

    // ================= 4. CÁC LỆNH KHÁC (ebal, einv, eshop, erob) =================
    if (command === 'ebal') {
        const embedBal = new EmbedBuilder()
            .setTitle(`💰 Ví Eurix của ${memberName}`)
            .setDescription(`- **Số dư:** ${user.balance} ${EMOJI_EURIX}\n- **Nghề nghiệp:** ${user.job || "Chưa làm việc"}`)
            .setColor(0xF1C40F);
        return message.reply({ embeds: [embedBal] });
    }

    if (command === 'einv') {
        const embedInv = new EmbedBuilder()
            .setTitle(`🎒 Kho Đồ Cá Nhân - ${memberName}`)
            .addFields(
                { name: "Số dư hiện tại:", value: `${user.balance} ${EMOJI_EURIX}`, inline: true },
                { name: "Lực chiến PvP:", value: `⚔️ ${user.combatPower}`, inline: true },
                { name: "Luckboost:", value: `🧪 ${user.luckboostCount} cái`, inline: true }
            )
            .setColor(0x9B59B6);
        return message.reply({ embeds: [embedInv] });
    }

    if (command === 'eshop') {
        const embedPage1 = new EmbedBuilder()
            .setTitle("🛒 Cửa hàng Eurix - Trang 1/2")
            .setDescription("Vật phẩm & Role độc quyền:\n- **Limitless** (<@&1536701167785086996>)\n- **TimeSkipper** (<@&1536947205611716699>)\n- **Counter** (<@&1536978004511563776>)\n- **Reroll Job**")
            .setImage("https://media.giphy.com/media/3xabPz6IlKqKMTLmbQ/giphy.gif")
            .setColor(0x00AE86);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('shop_p1').setLabel('Trang 1').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('shop_p2').setLabel('Trang 2 ➡️').setStyle(ButtonStyle.Secondary)
        );

        return message.reply({ embeds: [embedPage1], components: [row] });
    }

    if (command === 'erob' || command === 'esteal') {
        const member = message.member;
        const hasRole = member.roles.cache.has(CRIME_ROLE_ID);

        if (!hasRole || Math.random() < 0.5) {
            const penalty = Math.floor(user.balance * 0.15);
            user.balance = Math.max(0, user.balance - penalty);
            return message.reply(`❌ Bạn hành nghề trộm cắp, thay vì móc túi thì bạn lại sờ trúng hai hòn bi của họ và bị đập cho tơi tả! Mất **${penalty} ${EMOJI_EURIX}**.`);
        } else {
            const percent = (Math.random() * 3 + 2) / 100;
            const stolen = Math.floor(user.balance * percent);
            user.balance += stolen;
            return message.reply(`✅ Bạn đã hành nghề móc túi và thành công đớp được **${stolen} ${EMOJI_EURIX}**!`);
        }
    }
});

// Tương tác nút bấm
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const user = getUser(interaction.user.id);
    const userId = interaction.user.id;

    if (interaction.customId === 'rr_shoot') {
        const game = activeRouletteGames.get(userId);
        if (!game) return interaction.reply({ content: "Ván game không tồn tại!", ephemeral: true });

        if (game.currentIndex === game.bulletIndex) {
            user.balance = Math.max(0, user.balance - game.bet);
            activeRouletteGames.delete(userId);
            const embedDead = new EmbedBuilder()
                .setTitle("💥 BÀNG!! Bạn đã trúng đạn!")
                .setDescription(`Bạn bị bắn chết tại chỗ và mất trắng **${game.bet} ${EMOJI_EURIX}**.`)
                .setColor(0xED4245);
            return interaction.update({ embeds: [embedDead], components: [] });
        } else {
            game.currentIndex++;
            if (game.currentIndex === game.bulletIndex) {
                const winAmount = Math.floor(game.bet * 1.25);
                user.balance += winAmount;
                activeRouletteGames.delete(userId);
                const embedBotDead = new EmbedBuilder()
                    .setTitle("🎉 CÁI ĐÃ BỊ BẮN CHẾT!")
                    .setDescription(`Bot bóp cò và trúng đạn! Bạn chiến thắng nhận **+${winAmount} ${EMOJI_EURIX}** (x1.25 tiền cược)!`)
                    .setColor(0x57F287);
                return interaction.update({ embeds: [embedBotDead], components: [] });
            } else {
                game.currentIndex++;
                const remaining = 6 - game.currentIndex;
                const embedNext = new EmbedBuilder()
                    .setTitle("🔫 Cò Quay Nga - Lượt tiếp theo!")
                    .setDescription(`*Cạch...* Thoát chết! Ổ đạn còn lại **${remaining} viên**. Tới lượt bạn tiếp tục bóp cò.`)
                    .setColor(0xE67E22);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('rr_shoot').setLabel('💥 Tiếp tục bóp cò!').setStyle(ButtonStyle.Danger)
                );
                return interaction.update({ embeds: [embedNext], components: [row] });
            }
        }
    }

    if (interaction.customId === 'bj_hit' || interaction.customId === 'bj_stand') {
        const game = activeBlackjackGames.get(userId);
        if (!game) return interaction.reply({ content: "Ván bài không tồn tại!", ephemeral: true });

        if (interaction.customId === 'bj_hit') {
            game.playerHand.push(drawCard(game.deck));
            const score = calculateScore(game.playerHand);

            if (score > 21) {
                user.balance = Math.max(0, user.balance - game.bet);
                activeBlackjackGames.delete(userId);
                const embedBust = new EmbedBuilder()
                    .setTitle("💥 Bạn đã bị Hoắc (Quá 21 điểm)!")
                    .setDescription(`Bài: ${formatHand(game.playerHand)} (${score} điểm). Mất **${game.bet} ${EMOJI_EURIX}**.`)
                    .setColor(0xED4245);
                return interaction.update({ embeds: [embedBust], components: [] });
            }

            const embedHit = new EmbedBuilder()
                .setTitle("🃏 Xì Dách - Rút bài")
                .addFields(
                    { name: "Bài của bạn:", value: `${formatHand(game.playerHand)} (Tổng: **${score}**)`, inline: false },
                    { name: "Bài Nhà Cái:", value: `${game.botHand[0].rank}${game.botHand[0].suit} | 🎴`, inline: false }
                )
                .setColor(0x3498DB);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Rút Bài').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('bj_stand').setLabel('🛑 Dừng Bài').setStyle(ButtonStyle.Success)
            );
            return interaction.update({ embeds: [embedHit], components: [row] });
        }

        if (interaction.customId === 'bj_stand') {
            while (calculateScore(game.botHand) < 17) {
                game.botHand.push(drawCard(game.deck));
            }
            const playerScore = calculateScore(game.playerHand);
            const botScore = calculateScore(game.botHand);
            activeBlackjackGames.delete(userId);

            let resultText = "";
            let color = 0x57F287;
            if (botScore > 21 || playerScore > botScore) {
                user.balance += game.bet;
                resultText = `🎉 **Bạn Thắng!** Nhận **+${game.bet} ${EMOJI_EURIX}**!`;
            } else if (playerScore < botScore) {
                user.balance = Math.max(0, user.balance - game.bet);
                resultText = `❌ **Nhà Cái Thắng!** Mất **${game.bet} ${EMOJI_EURIX}**.`;
                color = 0xED4245;
            } else {
                resultText = `🤝 **Hòa tiền!**`;
                color = 0xFEE75C;
            }

            const embedFinal = new EmbedBuilder()
                .setTitle("🃏 Kết Quả Xì Dách")
                .setDescription(resultText)
                .addFields(
                    { name: "Bài bạn:", value: `${formatHand(game.playerHand)} (${playerScore} đ)`, inline: true },
                    { name: "Bài Bot:", value: `${formatHand(game.botHand)} (${botScore} đ)`, inline: true }
                )
                .setColor(color);
            return interaction.update({ embeds: [embedFinal], components: [] });
        }
    }

    if (interaction.customId === 'shop_p1' || interaction.customId === 'shop_p2') {
        const isPage2 = interaction.customId === 'shop_p2';
        const embed = new EmbedBuilder()
            .setTitle(`🛒 Cửa hàng Eurix - Trang ${isPage2 ? '2/2' : '1/2'}`)
            .setDescription(isPage2 ? "Vật phẩm đặc quyền:\n- **Leak video**\n- **Lọ Thủ**\n- **Custom Role**\n- **Luckboost**" : "Vật phẩm hệ thống:\n- **Limitless**\n- **TimeSkipper**\n- **Counter**\n- **Reroll Job**")
            .setColor(isPage2 ? 0xFEE75C : 0x00AE86);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('shop_p1').setLabel('⬅️ Trang 1').setStyle(ButtonStyle.Secondary).setDisabled(!isPage2),
            new ButtonBuilder().setCustomId('shop_p2').setLabel('Trang 2 ➡️').setStyle(ButtonStyle.Primary).setDisabled(isPage2)
        );
        return interaction.update({ embeds: [embed], components: [row] });
    }
});

// Hàm hỗ trợ bài tây
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (let s of suits) for (let r of ranks) deck.push({ suit: s, rank: r });
    return deck.sort(() => Math.random() - 0.5);
}
function drawCard(deck) { return deck.pop(); }
function calculateScore(hand) {
    let score = 0, aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.rank)) score += 10;
        else if (card.rank === 'A') { score += 11; aces++; }
        else score += parseInt(card.rank);
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}
function formatHand(hand) { return hand.map(c => `\`${c.rank}${c.suit}\``).join(' '); }

// --- TẠO MỘT WEB SERVER GIẢ LẬP ĐỂ RENDER KHÔNG BỊ LỖI PORT TIMEOUT ---
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Eurix is running and alive!\n');
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🌐 Web server giả lập đang chạy trên cổng ${PORT}`);
});

// --- BẮT LỖI VÀ ĐĂNG NHẬP AN TOÀN ---
console.log("⏳ Đang chuẩn bị kết nối tới Discord...");

client.on('error', error => {
    console.error("🔥 LỖI CLIENT:", error);
});

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
    console.error("❌ LỖI: Chưa có biến môi trường DISCORD_TOKEN trên Render!");
} else {
    client.login(discordToken).then(() => {
        console.log(`✅ ĐÃ KẾT NỐI THÀNH CÔNG VỚI DISCORD GATEWAY! Bot: ${client.user.tag}`);
    }).catch(err => {
        console.error("❌ ĐĂNG NHẬP THẤT BẠI:", err.message);
    });
}
