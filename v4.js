// === FILE: v4.js (Đồng bộ đáp án trực tiếp vào từng câu hỏi) ===
(function() {
    const old = document.getElementById("kh-ui-v4");
    if (old) old.remove();
    const v3 = document.getElementById("kh-ui-v3");
    if (v3) v3.remove();

    let cfg = { mode: "reveal", auto: false };
    let qQueue = [];

    const ui = document.createElement("div");
    ui.id = "kh-ui-v4";
    ui.style.cssText = `
        position: fixed; top: 15px; right: 15px; width: 275px;
        background: #11111b; color: #cdd6f4; padding: 15px;
        border-radius: 10px; z-index: 999999; font-family: sans-serif;
        border: 2px solid #cba6f7; box-shadow: 0 5px 25px rgba(0,0,0,0.85);
    `;
    ui.innerHTML = `
        <div style="font-weight:bold; font-size:15px; color:#cba6f7; margin-bottom:10px; display:flex; justify-content:space-between;">
            <span>👑 Khan Hack v4 (Chuẩn)</span>
            <span id="kh-close" style="cursor:pointer; color:#f38ba8;">✕</span>
        </div>
        <div style="margin-bottom:8px; font-size:13px;">
            <label style="display:block; margin-bottom:5px; cursor:pointer;">
                <input type="radio" name="kh-m" value="reveal" checked> 💡 Hiện đáp án ngay trên đề bài
            </label>
            <label style="display:block; margin-bottom:5px; cursor:pointer;">
                <input type="radio" name="kh-m" value="spoof"> ⚡ Biến mọi câu thành 1 nút Đúng
            </label>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:10px; cursor:pointer; font-size:13px; border-top:1px solid #313244; padding-top:8px;">
            <input type="checkbox" id="kh-auto"> 🤖 Tự động chọn & qua câu (Auto)
        </label>
        <div id="kh-ans-box" style="font-size:12px; color:#f9e2af; background:#1e1e2e; padding:8px; border-radius:6px; max-height:160px; overflow-y:auto; line-height:1.4; border:1px solid #45475a;">
            ✅ <b>Đã đồng bộ!</b><br>Đáp án sẽ được in trực tiếp lên đầu mỗi câu hỏi trên màn hình để không bị lệch thứ tự!
        </div>
    `;
    document.body.appendChild(ui);

    document.getElementById("kh-close").onclick = () => ui.remove();
    document.querySelectorAll('input[name="kh-m"]').forEach(r => {
        r.onchange = (e) => cfg.mode = e.target.value;
    });
    document.getElementById("kh-auto").onchange = (e) => cfg.auto = e.target.checked;
    const box = document.getElementById("kh-ans-box");

    function parseWidgets(w) {
        let ans = [];
        for (const k in w) {
            const i = w[k];
            if (!i || !i.options) continue;
            if (i.type === "radio" && i.options.choices) {
                i.options.choices.forEach((c, idx) => {
                    if (c.correct) ans.push({ type: "radio", index: idx, text: `Chọn ô thứ ${idx + 1}: ${c.content}` });
                });
            } else if (i.type === "numeric-input" && i.options.answers) {
                i.options.answers.forEach(a => {
                    if (a.status === "correct") ans.push({ type: "input", val: a.value, text: `Điền số: ${a.value}` });
                });
            } else if (i.type === "input-number" && i.options.value !== undefined) {
                ans.push({ type: "input", val: i.options.value, text: `Điền số: ${i.options.value}` });
            } else if (i.type === "expression" && i.options.answerForms) {
                i.options.answerForms.forEach(a => {
                    if (a.considered === "correct") ans.push({ type: "input", val: a.value, text: `Điền biểu thức: ${a.value}` });
                });
            } else if (i.type === "dropdown" && i.options.choices) {
                i.options.choices.forEach(c => {
                    if (c.correct) ans.push({ type: "dropdown", text: `Chọn menu: ${c.content}` });
                });
            }
        }
        return ans;
    }

    function processNode(o) {
        if (!o || typeof o !== "object") return false;
        let modified = false;
        if (typeof o.itemData === "string") {
            try {
                let d = JSON.parse(o.itemData);
                if (d.question && d.question.widgets) {
                    const a = parseWidgets(d.question.widgets);
                    let lastHint = (d.hints && d.hints.length > 0) ? (d.hints[d.hints.length - 1].content || "") : "";

                    if (cfg.mode === "spoof") {
                        d.question.content = "⚡ **[ĐÃ GIẢI TỰ ĐỘNG]** Bấm vào ô duy nhất bên dưới để qua câu:\n\n[[☃ radio 1]]";
                        d.question.widgets = {
                            "radio 1": {
                                type: "radio", alignment: "default", static: false, graded: true,
                                options: {
                                    choices: [{ content: "✅ Bấm vào đây (Đáp án đúng)", correct: true }],
                                    randomize: false, multipleSelect: false, displayCount: null,
                                    hasNoneOfTheAbove: false, onePerLine: true, deselectEnabled: false
                                },
                                version: { major: 1, minor: 0 }
                            }
                        };
                        qQueue.push([{ type: "radio", index: 0, text: "Ô số 1 (Spoof)" }]);
                        modified = true;
                    } else {
                        const cleanList = a.map(x => "• **" + x.text.replace(/\n/g, " ") + "**").join("\n");
                        const banner = a.length > 0
                            ? `> 🎯 **ĐÁP ÁN CÂU NÀY:**\n> ${cleanList.replace(/\n/g, "\n> ")}\n\n---\n\n`
                            : (lastHint ? `> 💡 **LỜI GIẢI CUỐI:** ${lastHint}\n\n---\n\n` : "");

                        if (banner && !d.question.content.includes("🎯 **ĐÁP ÁN")) {
                            d.question.content = banner + d.question.content;
                            modified = true;
                        }
                        qQueue.push(a);
                    }

                    box.innerHTML = `<div style="color:#a6e3a1;font-weight:bold;margin-bottom:4px;">📦 Đã gắn đáp án vào ${qQueue.length} câu hỏi!</div>Hãy nhìn thẳng lên dòng chữ <b>🎯 ĐÁP ÁN CÂU NÀY</b> nằm ngay phía trên đề bài!`;
                    if (modified) o.itemData = JSON.stringify(d);
                }
            } catch (e) {}
        }
        for (const k in o) {
            if (processNode(o[k])) modified = true;
        }
        return modified;
    }

    if (!window._khOrigF) window._khOrigF = window.fetch;
    window.fetch = async function(...args) {
        const res = await window._khOrigF.apply(this, args);
        try {
            const cl = res.clone(), txt = await cl.text();
            if (txt.includes('"itemData"')) {
                const data = JSON.parse(txt);
                if (processNode(data)) {
                    return new Response(JSON.stringify(data), {
                        status: res.status, statusText: res.statusText, headers: res.headers
                    });
                }
            }
        } catch (e) {}
        return res;
    };

    if (window._khInt) clearInterval(window._khInt);
    window._khInt = setInterval(() => {
        if (!cfg.auto) return;
        if (cfg.mode === "spoof") {
            const r = document.querySelectorAll('[role="radio"], [data-test-id="choice-icon-library-choice-icon"]');
            if (r.length > 0) r[0].click();
        }
        const c = document.querySelector('[data-test-id="exercise-check-answer"]');
        const n = document.querySelector('[data-test-id="exercise-next-question"]');
        if (n && !n.disabled) n.click();
        else if (c && !c.disabled) c.click();
    }, 900);
})();
