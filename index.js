const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1493932821528707202/H9vpB_SrcYQe2HR0noBcp24DlpuZPn4P9cTNZK7X0ftVAe2t8KNintIiSQjYx65OzGH-";

// Danh sách quản lý các máy đang treo
let sessions = {};

app.post('/ping', async (req, res) => {
    const { username, userId, gameName, startTime } = req.body;
    if (!username) return res.status(400).send("Missing data");

    const now = Date.now();

    // Nếu là tài khoản mới hoặc đã từng bị xóa do dis
    if (!sessions[username]) {
        sessions[username] = {
            lastSeen: now,
            userId: userId,
            gameName: gameName,
            startTime: startTime
        };

        // Gửi thông báo BẮT ĐẦU (Chỉ gửi 1 lần duy nhất)
        const embed = {
            embeds: [{
                title: "➕ TÀI KHOẢN BẮT ĐẦU TREO",
                color: 5763719, // Màu xanh tươi
                thumbnail: { url: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png` },
                fields: [
                    { name: "👤 Tài khoản", value: `**${username}**`, inline: true },
                    { name: "🎮 Game", value: gameName, inline: true },
                    { name: "⏰ Bắt đầu lúc", value: startTime, inline: false }
                ],
                footer: { text: "Hệ thống giám sát treo acc" }
            }]
        };

        axios.post(DISCORD_WEBHOOK, embed).catch(e => console.log("Lỗi gửi Webhook Start"));
    } else {
        // Nếu đã tồn tại thì chỉ cập nhật thời gian tín hiệu cuối
        sessions[username].lastSeen = now;
    }

    res.status(200).send("PONG");
});

// Kiểm tra dis mỗi 5 giây
setInterval(() => {
    const now = Date.now();
    for (const user in sessions) {
        if (now - sessions[user].lastSeen > 30000) { // Quá 30 giây không ping
            const disTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            
            const embed = {
                embeds: [{
                    title: "⚠️ CẢNH BÁO: MẤT KẾT NỐI",
                    description: `Tài khoản **${user}** đã ngừng gửi tín hiệu!`,
                    color: 15548997, // Màu đỏ
                    thumbnail: { url: `https://www.roblox.com/headshot-thumbnail/image?userId=${sessions[user].userId}&width=420&height=420&format=png` },
                    fields: [
                        { name: "❌ Trạng thái", value: "Đã Disconnect / Sập máy ảo", inline: true },
                        { name: "🕒 Thời gian bị ngắt", value: disTime, inline: true }
                    ]
                }]
            };

            axios.post(DISCORD_WEBHOOK, embed).catch(e => console.log("Lỗi gửi Webhook Dis"));
            
            // Xóa khỏi danh sách sau khi báo dis
            delete sessions[user];
        }
    }
}, 5000);

app.listen(process.env.PORT || 3000, () => console.log("Server Running..."));
