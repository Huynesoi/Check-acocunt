const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1493932821528707202/H9vpB_SrcYQe2HR0noBcp24DlpuZPn4P9cTNZK7X0ftVAe2t8KNintIiSQjYx65OzGH-";

let sessions = {};

app.post('/ping', async (req, res) => {
    const { username, userId, gameName, startTime } = req.body;
    if (!username) return res.status(400).send("No data");

    const now = Date.now();

    // Nếu là acc mới, gửi tin nhắn thông báo lên Discord
    if (!sessions[username]) {
        console.log(`[START] ${username} đang kết nối...`);
        sessions[username] = { lastSeen: now, userId, gameName, startTime };

        const embed = {
            embeds: [{
                title: "✅ TÀI KHOẢN ĐANG TREO",
                color: 65280,
                thumbnail: { url: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png` },
                fields: [
                    { name: "👤 User", value: `**${username}**`, inline: true },
                    { name: "🎮 Game", value: gameName, inline: true },
                    { name: "⏳ Start", value: startTime, inline: false }
                ]
            }]
        };

        // Gửi thử, nếu lỗi thì log ra console của Render
        axios.post(DISCORD_WEBHOOK, embed).catch(err => console.error("Discord Error:", err.response?.data || err.message));
    } else {
        // Chỉ cập nhật thời gian, không gửi webhook để tránh bị khóa
        sessions[username].lastSeen = now;
    }

    res.status(200).send("Updated");
});

// Check disconnect mỗi 10 giây
setInterval(() => {
    const now = Date.now();
    for (const user in sessions) {
        // Nếu quá 35 giây không thấy tín hiệu (cho dư ra 5s để tránh lag)
        if (now - sessions[user].lastSeen > 35000) {
            console.log(`[DISCONNECT] ${user} đã sập!`);
            
            const embed = {
                embeds: [{
                    title: "❌ CẢNH BÁO: MẤT KẾT NỐI",
                    description: `Acc **${user}** đã dừng nhận thông báo!`,
                    color: 16711680,
                    thumbnail: { url: `https://www.roblox.com/headshot-thumbnail/image?userId=${sessions[user].userId}&width=150&height=150&format=png` },
                    fields: [
                        { name: "🕒 Thời gian dis", value: new Date().toLocaleString('vi-VN'), inline: true }
                    ]
                }]
            };

            axios.post(DISCORD_WEBHOOK, embed).catch(err => console.error("Discord Error:", err.response?.data || err.message));
            delete sessions[user];
        }
    }
}, 10000);

app.get('/', (req, res) => res.send("Hệ thống check acc đang chạy!"));

app.listen(process.env.PORT || 3000);
