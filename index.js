const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1493932821528707202/H9vpB_SrcYQe2HR0noBcp24DlpuZPn4P9cTNZK7X0ftVAe2t8KNintIiSQjYx65OzGH-";
const TIMEOUT_LIMIT = 30000; // 30 giây không thấy tín hiệu sẽ báo DIS
let players = {};

// Hàm lấy link ảnh đại diện Roblox
async function getAvatar(userId) {
    try {
        const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        return res.data.data[0].imageUrl;
    } catch (err) {
        return "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png"; // Ảnh mặc định nếu lỗi
    }
}

app.post('/heartbeat', async (req, res) => {
    const { username, userId, game, uptime } = req.body;
    const now = Date.now();

    if (!players[username]) {
        // Nếu là lần đầu tiên script chạy, gửi thông báo Online kèm Avatar
        const avatarUrl = await getAvatar(userId);
        
        const embed = {
            username: "Hệ thống Check Acc",
            embeds: [{
                title: "🟢 TÀI KHOẢN ĐÃ TRỰC TUYẾN",
                color: 65280, // Màu xanh lá
                thumbnail: { url: avatarUrl },
                fields: [
                    { name: "Tên tài khoản", value: `**${username}**`, inline: true },
                    { name: "Đang chơi", value: game, inline: true },
                    { name: "Thời gian đã treo", value: `${uptime} giây`, inline: false }
                ],
                timestamp: new Date()
            }]
        };

        await axios.post(DISCORD_WEBHOOK, embed);
        console.log(`${username} đang chạy script.`);
    }

    // Cập nhật hoặc khởi tạo trạng thái tài khoản
    players[username] = {
        userId: userId,
        lastSeen: now,
        notifiedDis: false
    };

    res.sendStatus(200);
});

// Kiểm tra định kỳ mỗi 5 giây xem có acc nào bị mất kết nối không
setInterval(async () => {
    const now = Date.now();
    for (let username in players) {
        const p = players[username];
        
        if (now - p.lastSeen > TIMEOUT_LIMIT && !p.notifiedDis) {
            const avatarUrl = await getAvatar(p.userId);
            const timeLost = new Date(p.lastSeen).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

            const embed = {
                username: "Hệ thống Check Acc",
                embeds: [{
                    title: "🔴 CẢNH BÁO: MẤT KẾT NỐI!",
                    color: 16711680, // Màu đỏ
                    thumbnail: { url: avatarUrl },
                    description: `Tài khoản **${username}** đã ngừng gửi tín hiệu.`,
                    fields: [
                        { name: "Thời gian mất kết nối", value: timeLost }
                    ],
                    footer: { text: "Vui lòng kiểm tra lại máy ảo!" }
                }]
            };

            await axios.post(DISCORD_WEBHOOK, embed);
            p.notifiedDis = true; 
            
            // Xóa khỏi danh sách để nếu acc login lại sẽ báo Online mới
            delete players[username];
        }
    }
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server monitoring is active on port ${PORT}`));
