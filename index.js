const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Điền Webhook của bạn vào đây
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1493932821528707202/H9vpB_SrcYQe2HR0noBcp24DlpuZPn4P9cTNZK7X0ftVAe2t8KNintIiSQjYx65OzGH-";

// Biến lưu trữ trạng thái các tài khoản đang treo
let activePlayers = {};

app.post('/ping', async (req, res) => {
    const { username, userId, gameName, startTime } = req.body;

    if (!activePlayers[username]) {
        // Lần đầu nhận tín hiệu -> Gửi thông báo bắt đầu treo
        activePlayers[username] = { lastSeen: Date.now(), notified: true };

        const embed = {
            embeds: [{
                title: "🟢 TÀI KHOẢN ĐANG TREO SCRIPT",
                color: 3066993, // Màu xanh lá
                fields: [
                    { name: "👤 Tên tài khoản", value: `**${username}**`, inline: true },
                    { name: "🎮 Đang chơi Game", value: gameName, inline: true },
                    { name: "⏰ Thời gian bắt đầu", value: startTime, inline: true }
                ],
                thumbnail: {
                    // Tự động lấy Avatar Headshot của Roblox theo UserId
                    url: `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`
                }
            }]
        };

        try {
            await axios.post(DISCORD_WEBHOOK, embed);
        } catch (err) {
            console.error("Lỗi gửi webhook kết nối:", err.message);
        }
    } else {
        // Nếu đã có trong danh sách -> Cập nhật lại thời gian lastSeen
        activePlayers[username].lastSeen = Date.now();
    }

    res.status(200).send("OK");
});

// Vòng lặp kiểm tra liên tục mỗi 5 giây
setInterval(() => {
    const now = Date.now();
    for (const username in activePlayers) {
        // Nếu qua 30 giây (30000 ms) mà không có tín hiệu ping
        if (now - activePlayers[username].lastSeen > 30000) {
            
            // Lấy thời gian báo dis
            const timeStr = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + " - " + new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

            const embed = {
                embeds: [{
                    title: "🔴 CẢNH BÁO: MẤT KẾT NỐI",
                    description: `Tài khoản **${username}** đã mất tín hiệu hơn 30 giây! Vui lòng vào máy ảo check ngay.`,
                    color: 15158332, // Màu đỏ
                    fields: [
                        { name: "⏰ Thời gian ngừng nhận thông báo", value: timeStr, inline: true }
                    ]
                }]
            };

            axios.post(DISCORD_WEBHOOK, embed).catch(e => console.error("Lỗi gửi webhook báo dis:", e.message));

            // Xóa khỏi danh sách để nếu acc đó vô lại sẽ được tính là phiên mới
            delete activePlayers[username];
        }
    }
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Render đang chạy ở cổng ${PORT}`);
});
