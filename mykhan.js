(function() {
    if (window.myKhanLoaded) {
        alert("Hack đã bật sẵn rồi! Hãy bấm vào bài tập mới để bắt đầu.");
        return;
    }
    window.myKhanLoaded = true;

    let config = {
        spoof: true,
        auto: false
    };

    // 1. GIAO DIỆN MENU
    const ui = document.createElement("div");
    ui.style.cssText = `
        position: fixed; top: 15px; right: 15px; width: 250px;
        background: #11111b; color: #cdd6f4; padding: 15px;
        border-radius: 10px; z-index: 999999; font-family: sans-serif;
        border: 2px solid #89b4fa; box-shadow: 0 5px 20px rgba(0,0,0,0.7);
    `;
    ui.innerHTML = `
        <div style="font-weight:bold; font-size:16px; color:#89b4fa; margin-bottom:10px; display:flex; justify-content:space-between;">
            <span>👑 Khan Hack v2</span>
            <span id="kh-close" style="cursor:pointer; color:#f38ba8;">✕</span>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer; font-size:14px;">
            <input type="checkbox" id="kh-spoof" checked> Tự động đúng (Spoof)
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:10px; cursor:pointer; font-size:14px;">
            <input type="checkbox" id="kh-auto"> Tự động bấm (Auto-Click)
        </label>
        <div id="kh-status" style="font-size:12px; color:#a6e3a1; background:#1e1e2e; padding:8px; border-radius:6px; line-height:1.4;">
            💡 <b>Hướng dẫn:</b> Hãy bật menu này TRƯỚC KHI bấm vào bài tập (hoặc qua câu tiếp theo để bắt đầu có tác dụng).
        </div>
    `;
    document.body.appendChild(ui);

    document.getElementById("kh-close").onclick = () => ui.remove();
    document.getElementById("kh-spoof").onchange = (e) => config.spoof = e.target.checked;
    document.getElementById("kh-auto").onchange = (e) => config.auto = e.target.checked;
    const statusBox = document.getElementById("kh-status");

    // 2. CHẶN GÓI TIN CÂU HỎI (CHUẨN CẤU TRÚC PERSEUS CỦA KHAN ACADEMY)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] instanceof Request ? args[0].url : String(args[0]);

        if (config.spoof && url.includes("getAssessmentItem")) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                const item = data?.data?.assessmentItem?.item;

                if (item && item.itemData) {
                    let itemData = JSON.parse(item.itemData);

                    // Ghi đè câu hỏi bằng mẫu chuẩn của Perseus
                    itemData.answerArea = {
                        calculator: false,
                        chi2Table: false,
                        periodicTable: false,
                        t
