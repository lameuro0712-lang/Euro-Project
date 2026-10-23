// index.js
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

const TOKEN = process.env.DISCORD_TOKEN;
const CRIME_ROLE_ID = "1536004180555333803"; // Role được phép cướp

// Lưu trữ trạng thái game nhỏ đang chạy (Xì dách / Cò quay)
const activeBlackjack = new Map();
const activeRoulette = new Map();

client.once('ready', () => {
    console.log(`🤖 Bot Eurix đã sẵn sàng càn quét server! Đăng nhập: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();
    const user = getUser(message.author.id);

    // ================= 1. HỆ THỐNG LÀM VIỆC (elamviec) =================
    if (command === 'elamviec') {
        const now = Date.now();
        const cooldown = 3600 * 1000; // 1 giờ
        const isOnCooldown = (now - user.lastWorkTime) < cooldown;

        // Gacha nghề lần đầu
        if (!user.job) {
            let roll = Math.random() * 100;
            // Kiểm tra xem có đang bật Luckboost không
            if (user.luckboostExpiry > now) roll -= 5; // Tăng tỷ lệ trúng nghề cao hơn chút

            if (roll < 40) user.job = "Game Thủ";
            else if (roll < 75) user.job = "Animator";
            else if (roll < 95) user.job = "Content Creator";
            else user.job = "Actor";

            return message.reply(`🎉 Chúc mừng bạn đã gacha trúng nghề khởi đầu: **${user.job}**! Hãy gõ lại lệnh \`elamviec\` sau để bắt đầu nhận lương.`);
        }

        // Nếu đang trong thời gian Cooldown (1 giờ)
        if (isOnCooldown) {
            // Tỷ lệ ra tình huống trừ tiền tăng lên 30% khi spam lúc cooldown
            if (Math.random() < 0.3) {
                const penalty = 10;
                user.balance = Math.max(0, user.balance - penalty);
                return message.reply(`⚠️ Bạn đang trong thời gian nghỉ ngơi mà cứ cố làm việc! Bị phạt trừ **${penalty} Eurix** <:Eurix:1563134915346698331>.`);
            } else {
                // Tình Trạng Pháo Đài (Tình huống vui)
                const fortressSituations = [
                    "🏰 1 thằng nhóc đeo kính áo vàng cùng 1 con chồn màu xanh ghé thăm pháo đài. Nhìn dị vcl!",
                    "🏰 Mấy thằng nhóc trong sân banh cứ vừa đá bóng vừa xếp hình rồi lẩm bẩm về việc đá bóng bằng cả tính mạng, chả hiểu kiểu gì.",
                    "🏰 Lòi đâu ra một thằng cha ủng hộ Israel đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Lòi đâu ra một con mẹ ủng hộ phát xít đức đứng rêu rao khắp phố. Mấy anh công an đâu rồi?",
                    "🏰 Công viên gần nhà vừa thuê nhân viên dọn nhà vệ sinh mới, ổng làm việc rất hăng say, nhà vệ sinh nào ổng dọn cũng sạch bong kin kít. Hỏi ổng thì mới biết ổng tên Tom Pearl."
                ];
                return message.reply(fortressSituations[Math.floor(Math.random() * fortressSituations.length)]);
            }
        }

        // Tính lương cơ bản theo giờ
        let salary = 0;
        if (user.job === "Game Thủ") salary = 5;
        else if (user.job === "Animator") salary = 10;
        else if (user.job === "Content Creator") salary = 15;
        else if (user.job === "Actor") salary = 30;

        user.balance += salary;
        user.lastWorkTime = now;

        // Xử lý các tình huống ngẫu nhiên theo từng nghề (Tỷ lệ: Chọn, Trừ, Thêm, Cộng bình thường)
        let sitRoll = Math.random() * 100;
        let situationText = "";

        if (user.job === "Game Thủ") {
            if (sitRoll < 20) { // Tình huống Chọn
                user.balance += 10; // Giả lập chọn Có
                situationText = "\n🎮 [Tình huống chọn]: Donater ngẫu nhiên muốn bạn lắc peach cho mọi người xem. Bạn đồng ý -> **+10 Eurix**!";
            } else if (sitRoll < 60) { // Tình huống Cộng tiền bình thường
                situationText = "\n🎮 Ca làm việc trôi qua êm ả.";
            } else if (sitRoll < 80) { // Tình huống Trừ
                user.balance = Math.max(0, user.balance - 5);
                situationText = "\n🎮 [Tình huống trừ]: Bạn bị cháy máy vì tải Genshin Impact về -> **-5 Eurix**!";
            } else { // Tình huống Thêm
                user.balance += 50;
                situationText = "\n🎮 [Tình huống thêm]: Bạn được donate nóng -> **+50 Eurix**!";
            }
        } 
        else if (user.job === "Animator") {
            if (sitRoll < 25) {
                user.balance += 12;
                situationText = "\n🎨 [Tình huống chọn]: Sếp nhờ nhổ giúp cọng lông nách. Bạn đồng ý -> **+12 Eurix** (Sếp cảm ơn bạn rất nhiều).";
            } else if (sitRoll < 50) {
                let fine = Math.floor(user.balance * 0.1);
                user.balance = Math.max(0, user.balance - fine);
                situationText = `\n🎨 [Tình huống chọn]: Bạn từ chối sếp -> Sếp nổi giận trừ **10% số tiền** (${fine} Eurix)!`;
            } else if (sitRoll < 75) {
                user.balance = Math.max(0, user.balance - 10);
                situationText = "\n🎨 [Tình huống trừ]: Bạn bị sếp quỵt lương sau khi làm 3600 frame hoạt hình -> **-10 Eurix**!";
            } else {
                user.balance += 40;
                situationText = "\n🎨 [Tình huống thêm]: Bạn vẽ xong 1 tập phim hoạt hình và nó cực kỳ thành công -> **+40 Eurix**!";
            }
        }
        else if (user.job === "Content Creator") {
            if (sitRoll < 30) {
                if (Math.random() < 0.2) {
                    user.balance += 30;
                    situationText = "\n💻 [Tình huống chọn]: 1 thằng ngẫu nhiên muốn hợp tác. Bạn hợp tác rất thuận lợi -> **+30 Eurix**!";
                } else {
                    user.balance = Math.max(0, user.balance - 20);
                    situationText = "\n💻 [Tình huống chọn]: Hợp tác tạch, bạn bị hack bay mẹ kênh -> **-20 Eurix**!";
                }
            } else if (sitRoll < 65) {
                user.balance = Math.max(0, user.balance - 15);
                situationText = "\n💻 [Tình huống trừ]: Bạn làm video mệt ỉa nhưng chỉ được 200 view -> **-15 Eurix**!";
            } else {
                user.balance += 20;
                situationText = "\n💻 [Tình huống thêm]: Video của bạn bỗng dưng Viral -> **+20 Eurix**!";
            }
        }
        else if (user.job === "Actor") {
            if (sitRoll < 30) {
                if (Math.random() < 0.4) {
                    user.balance += 80;
                    situationText = "\n🎬 [Tình huống chọn]: Đóng quảng cáo thành công vcl -> **+80 Eurix**!";
                } else {
                    let fine = Math.floor(user.balance * 0.1);
                    user.balance = Math.max(0, user.balance - fine);
                    situationText = `\n🎬 [Tình huống chọn]: Bạn bị dắt sang cam -> Mất **10% số tiền** (${fine} Eurix)!`;
                }
            } else if (sitRoll < 65) {
                user.balance = Math.max(0, user.balance - 50);
                situationText = "\n🎬 [Tình huống trừ]: Bộ phim bạn đóng dở ẹc, khán giả quay ra công kích -> **-50 Eurix**!";
            } else {
                user.balance += 60;
                situationText = "\n🎬 [Tình huống thêm]: Bộ phim bạn đóng cực kỳ nổi tiếng -> **+60 Eurix**!";
            }
        }

        return message.reply(`⏰ Nhận lương nghề **${user.job}**: **+${salary} Eurix** <:Eurix:1563134915346698331>${situationText}\n💰 Số dư hiện tại: **${user.balance} Eurix**.`);
    }

    // ================= 2. LỆNH XEM SỐ DƯ (ebal) =================
    if (command === 'ebal') {
        return message.reply(`💰 Số dư tài khoản: **${user.balance} Eurix** <:Eurix:1563134915346698331> | Nghề nghiệp: **${user.job || "Chưa có"}**`);
    }

    // ================= 3. LỆNH KHO ĐỒ (einv) =================
    if (command === 'einv') {
        return message.reply(`🎒 **Kho đồ cá nhân:**\n- Số dư: ${user.balance} Eurix\n- Lực chiến: ${user.combatPower}\n- Luckboost sở hữu: ${user.luckboostCount} (Dùng lệnh tương tác cửa hàng để mua)`);
    }

    // ================= 4. CỬA HÀNG (eshop) =================
    if (command === 'eshop') {
        const embedPage1 = new EmbedBuilder()
            .setTitle("🛒 Cửa hàng Eurix - Trang 1/2")
            .setDescription("Vật phẩm & Role hệ thống:\n- **Limitless** (<@&1536701167785086996>)\n- **TimeSkipper** (<@&1536947205611716699>)\n- **Counter** (<@&1536978004511563776>)\n- **Reroll Job** (Gacha lại nghề, tăng tỷ lệ nghề cao)")
            .setImage("https://media.giphy.com/media/3xabPz6IlKqKMTLmbQ/giphy.gif")
            .setColor(0x00AE86);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('page_1').setLabel('Trang 1').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('page_2').setLabel('Trang 2 ➡️').setStyle(ButtonStyle.Secondary)
            );

        return message.reply({ embeds: [embedPage1], components: [row] });
    }

    // ================= 5. LỆNH CƯỚP TIỀN (erob / esteal) =================
    if (command === 'erob' || command === 'esteal') {
        const member = message.member;
        const hasRole = member.roles.cache.has(CRIME_ROLE_ID);

        // Không có role cướp -> 100% thất bại, mất 15% tiền
        if (!hasRole || Math.random() < 0.5) {
            const penalty = Math.floor(user.balance * 0.15);
            user.balance = Math.max(0, user.balance - penalty);
            return message.reply(`❌ Bạn hành nghề trộm cắp, thay vì móc túi thì bạn lại sờ trúng hai hòn bi của họ và bị đập cho tơi tả! Mất **${penalty} Eurix**.`);
        } else {
            // Cướp thành công 2-5%
            const percent = (Math.random() * 3 + 2) / 100;
            const stolen = Math.floor(user.balance * percent);
            user.balance += stolen;
            return message.reply(`✅ Bạn đã hành nghề móc túi và thành công đớp được **${stolen} Eurix** từ mục tiêu!`);
        }
    }

    // ================= 6. LỆNH PVP (Đấm nhau) =================
    if (command === 'epvp') {
        const target = message.mentions.users.first();
        const betAmount = parseInt(args[2]);

        if (!target || isNaN(betAmount) || betAmount <= 0) {
            return message.reply("⚠️ Cú pháp đúng: `epvp @user <số tiền cược>`");
        }
        if (user.balance < betAmount) {
            return message.reply("⚠️ Bạn không đủ tiền để cược trận pvp này!");
        }

        // Đơn giản hóa trận đấu đấm nhau trực tiếp
        user.balance -= betAmount;
        if (Math.random() < 0.5) {
            user.balance += betAmount * 2;
            user.combatPower += 5;
            return message.reply(`🥊 Bạn đã đấm bầm dập **<@${target.id}>** và giành chiến thắng! Húp gọn **${betAmount} Eurix** tiền thưởng và tăng lực chiến.`);
        } else {
            user.combatPower = Math.max(0, user.combatPower - 2);
            return message.reply(`💥 Bạn đã bị **<@${target.id}>** đấm cho tối tăm mặt mũi và thua cuộc! Mất **${betAmount} Eurix**.`);
        }
    }
});

// Xử lý chuyển trang cửa hàng qua nút bấm
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'page_2') {
        const embedPage2 = new EmbedBuilder()
            .setTitle("🛒 Cửa hàng Eurix - Trang 2/2")
            .setDescription("Vật phẩm đặc biệt:\n- **Leak video** (Gửi gif qua DM)\n- **Lọ Thủ** (<@&1553314784475090996>)\n- **Custom Role** (Tạo kênh ticket tùy chỉnh)\n- **Luckboost** (Tăng may mắn gacha/game trong 5 phút)")
            .setImage("https://media.giphy.com/media/K531hfEDGdIOKP024g/giphy.gif")
            .setColor(0xFEE75C);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('page_1').setLabel('⬅️ Trang 1').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('page_2').setLabel('Trang 2').setStyle(ButtonStyle.Primary).setDisabled(true)
            );

        await interaction.update({ embeds: [embedPage2], components: [row] });
    } else if (interaction.customId === 'page_1') {
        const embedPage1 = new EmbedBuilder()
            .setTitle("🛒 Cửa hàng Eurix - Trang 1/2")
            .setDescription("Vật phẩm & Role hệ thống:\n- **Limitless** (<@&1536701167785086996>)\n- **TimeSkipper** (<@&1536947205611716699>)\n- **Counter** (<@&1536978004511563776>)\n- **Reroll Job**")
            .setImage("https://media.giphy.com/media/3xabPz6IlKqKMTLmbQ/giphy.gif")
            .setColor(0x00AE86);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('page_1').setLabel('Trang 1').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('page_2').setLabel('Trang 2 ➡️').setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({ embeds: [embedPage1], components: [row] });
    }
});

client.login(TOKEN);

