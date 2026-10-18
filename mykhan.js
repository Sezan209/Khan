(function() {
    // Cho phép nạp đè bản mới nếu bấm lại nút
    const oldUi = document.getElementById("kh-ui-v3");
    if (oldUi) oldUi.remove();

    let config = {
        reveal: true, // Hiện trực tiếp đáp án đúng của câu hỏi
        spoof: false, // Ghi đè câu hỏi (chỉ bật khi muốn thử)
        auto: false   // Tự động bấm
    };

    // 1. TẠO GIAO DIỆN MENU V3
    const ui = document.createElement("div");
    ui.id = "kh-ui-v3";
    ui.style.cssText = `
        position: fixed; top: 15px; right: 15px; width: 270px;
        background: #11111b; color: #cdd6f4; padding: 15px;
        border-radius: 10px; z-index: 999999; font-family: sans-serif;
        border: 2px solid #a6e3a1; box-shadow: 0 5px 25px rgba(0,0,0,0.8);
    `;
    ui.innerHTML = `
        <div style="font-weight:bold; font-size:15px; color:#a6e3a1; margin-bottom:10px; display:flex; justify-content:space-between;">
            <span>⚡ Khan Hack v3 (Fix)</span>
            <span id="kh-close" style="cursor:pointer; color:#f38ba8;">✕</span>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer; font-size:13px;">
            <input type="checkbox" id="kh-reveal" checked> Hiện đáp án thật (An toàn 100%)
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer; font-size:13px;">
            <input type="checkbox" id="kh-spoof"> Đổi câu hỏi thành 1 nút (Spoof)
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:10px; cursor:pointer; font-size:13px;">
            <input type="checkbox" id="kh-auto"> Tự động bấm (Auto-Click)
        </label>
        <div id="kh-ans-box" style="font-size:12px; color:#f9e2af; background:#1e1e2e; padding:8px; border-radius:6px; max-height:150px; overflow-y:auto; line-height:1.4; border:1px solid #45475a;">
            ⏳ <b>Đang chờ câu hỏi...</b><br>Hãy bấm vào bài tập hoặc chuyển sang câu tiếp theo!
        </div>
    `;
    document.body.appendChild(ui);

    document.getElementById("kh-close").onclick = () => ui.remove();
    document.getElementById("kh-reveal").onchange = (e) => config.reveal = e.target.checked;
    document.getElementById("kh-spoof").onchange = (e) => config.spoof = e.target.checked;
    document.getElementById("kh-auto").onchange = (e) => config.auto = e.target.checked;
    const ansBox = document.getElementById("kh-ans-box");

    // 2. HÀM QUÉT VÀ LẤY ĐÁP ÁN TỪ MỌI CẤU TRÚC GÓI TIN
    function extractAnswers(widgets) {
        let results = [];
        for (const key in widgets) {
            const w = widgets[key];
            if (!w || !w.options) continue;

            // Trắc nghiệm (Radio / Multiple Choice)
            if (w.type === "radio" && w.options.choices) {
                w.options.choices.forEach((c, idx) => {
                    if (c.correct) {
                        results.push(`✅ Chọn ô thứ ${idx + 1}: <b>${c.content}</b>`);
                    }
                });
            }
            // Điền số / Điền chữ (Numeric / InputNumber / Expression)
            else if (w.type === "numeric-input" && w.options.answers) {
                w.options.answers.forEach(a => {
                    if (a.status === "correct") results.push(`🔢 Điền số: <b>${a.value}</b>`);
                });
            }
            else if (w.type === "input-number" && w.options.value !== undefined) {
                results.push(`🔢 Điền số: <b>${w.options.value}</b>`);
            }
            else if (w.type === "expression" && w.options.answerForms) {
                w.options.answerForms.forEach(a => {
                    if (a.considered === "correct") results.push(`📐 Điền biểu thức: <b>${a.value}</b>`);
                });
            }
            // Chọn menu thả xuống (Dropdown)
            else if (w.type === "dropdown" && w.options.choices) {
                w.options.choices.forEach(c => {
                    if (c.correct) results.push(`🔽 Chọn: <b>${c.content}</b>`);
                });
            }
        }
        return results;
    }

    // Hàm đệ quy tìm kiếm toàn bộ `itemData` nằm sâu trong gói tin bất kỳ
    function processJsonNode(obj) {
        if (!obj || typeof obj !== "object") return false;
        let modified = false;

        if (typeof obj.itemData === "string") {
            try {
                let itemData = JSON.parse(obj.itemData);
                if (itemData.question && itemData.question.widgets) {
                    // Trích xuất đáp án thật hiện lên bảng Menu
                    const answers = extractAnswers(itemData.question.widgets);
                    if (answers.length > 0) {
                        ansBox.innerHTML = `<div style="color:#a6e3a1; font-weight:bold; margin-bottom:4px;">🎯 ĐÁP ÁN CÂU NÀY:</div>` + answers.join("<br>");
                    } else {
                        ansBox.innerHTML = `ℹ️ Đã bắt được câu hỏi! (Hãy xem gợi ý ở đầu câu hỏi)`;
                    }

                    // Chèn thẳng đáp án lên đầu đề bài nếu bật Reveal
                    if (config.reveal && answers.length > 0) {
                        const cleanAns = answers.map(a => a.replace(/<[^>]*>/g, '')).join(" | ");
                        itemData.question.content = `> 💡 **[ĐÁP ÁN]: ${cleanAns}**\n\n---\n\n` + itemData.question.content;
                        modified = true;
                    }

                    // Nếu người dùng bật Spoof (biến câu hỏi thành 1 nút)
                    if (config.spoof) {
                        itemData.question.content = "⚡ **Câu hỏi đã được rút gọn!** Chọn đáp án đúng bên dưới:\n\n[[☃ radio 1]]";
                        itemData.question.widgets = {
                            "radio 1": {
                                type: "radio", alignment: "default", static: false, graded: true,
                                options: {
                                    choices: [{ content: "✅ Đáp án đúng", correct: true }],
                                    randomize: false, multipleSelect: false, displayCount: null,
                                    hasNoneOfTheAbove: false, onePerLine: true, deselectEnabled: false
                                },
                                version: { major: 1, minor: 0 }
                            }
                        };
                        modified = true;
                    }

                    if (modified) {
                        obj.itemData = JSON.stringify(itemData);
                    }
                }
            } catch (e) {}
        }

        for (const k in obj) {
            if (processJsonNode(obj[k])) modified = true;
        }
        return modified;
    }

    // 3. CHẶN MỌI GÓI TIN FETCH (BẤT KỂ TÊN URL LÀ GÌ)
    if (!window._khOriginalFetch) {
        window._khOriginalFetch = window.fetch;
    }
    window.fetch = async function(...args) {
        const response = await window._khOriginalFetch.apply(this, args);
        try {
            const clone = response.clone();
            const text = await clone.text();
            // Chỉ xử lý nếu trong gói tin trả về có chứa dữ liệu câu hỏi `itemData`
            if (text.includes('"itemData"')) {
                const data = JSON.parse(text);
                if (processJsonNode(data)) {
                    return new Response(JSON.stringify(data), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            }
        } catch (e) {}
        return response;
    };

    // 4. AUTO-CLICK THÔNG MINH
    if (window._khInterval) clearInterval(window._khInterval);
    window._khInterval = setInterval(() => {
        if (!config.auto) return;
        const checkBtn = document.querySelector('[data-test-id="exercise-check-answer"]');
        const nextBtn = document.querySelector('[data-test-id="exercise-next-question"]');
        if (nextBtn && !nextBtn.disabled) nextBtn.click();
        else if (checkBtn && !checkBtn.disabled) checkBtn.click();
    }, 800);
})();
