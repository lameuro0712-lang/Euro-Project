// database.js
const users = new Map();

function getUser(userId) {
    if (!users.has(userId)) {
        users.set(userId, {
            balance: 100,             // Số dư khởi điểm
            job: null,                // Nghề nghiệp hiện tại
            lastWorkTime: 0,          // Mốc thời gian làm việc lần cuối
            combatPower: 10,          // Lực chiến (Dùng cho pvp)
            luckboostCount: 0,        // Số lượng Luckboost trong kho đồ
            luckboostExpiry: 0        // Thời gian hiệu lực Luckboost (5 phút)
        });
    }
    return users.get(userId);
}

module.exports = { getUser };
