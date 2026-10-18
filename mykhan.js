// === FILE: mykhan.js ===
(function() {
    if (window.myKhanLoaded) {
        alert("Hack đã được bật rồi!");
        return;
    }
    window.myKhanLoaded = true;

    // Biến bật/tắt các tính năng
    let config = {
        spoofQuestion: true, // Tự động biến mọi câu hỏi thành câu trả lời đúng
        autoClick: false     // Tự động bấm nút Kiểm tra / Tiếp theo
    };

    // 1. TẠO GIAO DIỆN MENU NỔI (UI)
    const ui = document.createElement("div");
    ui.style.cssText = `
        position: fixed; top: 15px; right: 15px; width: 230px;
        background: #11111b; color: #cdd6f4; padding: 15px;
        border-radius: 10px; z-index: 999999; font-family: sans-serif;
        border: 2px solid #89b4fa; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    `;
    ui.innerHTML = `
        <div style="font-weight:bold; font-size:16px; color:#89b4fa; margin-bottom:10px; display:flex; justify-content:space-between;">
            <span>👑 Khan Hack</span>
            <span id="kh-close" style="cursor:pointer; color:#f38ba8;">✕</span>
        </div>
        <label style="display:block; margin-bottom:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" id="kh-spoof" checked> Tự động đúng (Spoof)
        </label>
        <label style="display:block; margin-bottom:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" id="kh-auto"> Tự động qua câu (Auto)
        </label>
        <button id="kh-video" style="width:100%; padding:6px; background:#a6e3a1; color:#11111b; font-weight:bold; border:none; border-radius:5px; cursor:pointer; margin-top:5px;">
            ⏩ Tua xong Video
        </button>
        <div id="kh-status" style="font-size:12px; color:#a6adc8; margin-top:10px;">
            Trạng thái: Đang hoạt động...
        </div>
    `;
    document.body.appendChild(ui);

    // Gán sự kiện cho các nút trên Menu
    document.getElementById("kh-close").onclick = () => ui.remove();
    document.getElementById("kh-spoof").onchange = (e) => config.spoofQuestion = e.target.checked;
    document.getElementById("kh-auto").onchange = (e) => config.autoClick = e.target.checked;

    // Nút tua nhanh video
    document.getElementById("kh-video").onclick = () => {
        const v = document.querySelector("video");
        if (v) {
            v.currentTime = v.duration - 0.2;
            v.play();
            document.getElementById("kh-status").innerText = "✅ Đã tua xong video!";
        } else {
            document.getElementById("kh-status").innerText = "❌ Không tìm thấy video!";
        }
    };

    // 2. CƠ CHẾ CHẶN MẠNG & LÀM GIẢ CÂU HỎI (QUESTION SPOOF)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] ? args[0].toString() : "";

        // Nếu trang web đang tải câu hỏi về và tính năng Spoof đang bật
        if (config.spoofQuestion && url.includes("getAssessmentItem")) {
            try {
                const clone = response.clone();
                const data = await clone.json();

                if (data?.data?.assessmentItem?.item?.itemData) {
                    let itemData = JSON.parse(data.data.assessmentItem.item.itemData);

                    // Thay thế nội dung câu hỏi phức tạp bằng 1 ô chọn đơn giản luôn đúng
                    itemData.question.content = "Câu hỏi đã được giải tự động! Bấm chọn ô bên dưới rồi nhấn **Kiểm tra (Check)**:\n\n[[☃ radio 1]]";
                    itemData.question.widgets = {
                        "radio 1": {
                            type: "radio",
                            options: {
                                choices: [
                                    { content: "✅ Bấm vào đây (Đáp án đúng)", correct: true }
                                ]
                            }
                        }
                    };

                    // Đóng gói lại dữ liệu đã chỉnh sửa và trả về cho trang web
                    data.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                    document.getElementById("kh-status").innerText = "⚡ Đã giải xong câu hỏi!";

                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            } catch (err) {
                console.error("Lỗi xử lý gói tin:", err);
            }
        }
        return response;
    };

    // 3. VÒNG LẶP TỰ ĐỘNG BẤM NÚT (AUTO CLICK)
    setInterval(() => {
        if (!config.autoClick) return;

        // Tự động tích vào ô đáp án đúng vừa tạo ở trên
        const radioChoice = document.querySelector('[data-test-id="choice-icon-library-choice-icon"]');
        if (radioChoice) radioChoice.click();

        // Tự động bấm nút Check Answer hoặc Next Question
        const checkBtn = document.querySelector('[data-test-id="exercise-check-answer"]');
        const nextBtn = document.querySelector('[data-test-id="exercise-next-question"]');
        if (checkBtn && !checkBtn.disabled) checkBtn.click();
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
    }, 800);
})();
