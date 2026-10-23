# 🚀 SEO · AEO · GEO MASTER SUITE
### Autonomous Multi-Agent Pipeline · Self-Healing Feedback Loop · Multi-Page & Sitemap Deep Crawler

Nền tảng kiểm định và truy quét lỗi SEO, AEO và GEO chuyên sâu với mô hình **đội ngũ 4 AI Agents chuyên biệt** phối hợp khép kín: Có người thực thi, có người chấm điểm, có người phản biện/review, có người kiểm thử tự động, và **tự động kích hoạt Vòng lặp phản hồi (Self-Healing Feedback Loop)** để sinh mã sửa lỗi và tái kiểm định cho đến khi đạt chuẩn nghiệm thu Quality Gate!

---

## 🌟 Tính Năng Đột Phá Mới

### 1. Hệ Thống 4 AI Agents Đa Vai Trò Phối Hợp Khép Kín:
* 👷 **Specialist-AI (Kỹ Sư Trưởng Thực Thi):** Crawl toàn diện 6 giai đoạn, bóc tách cấu trúc HTML/DOM, trích xuất sitemap và tự động viết các bản vá mã nguồn khắc phục lỗi (*Nginx 301, Schema JSON-LD, Robots.txt, file llms.txt*).
* 📊 **Scorer-AI (Trọng Tài Định Lượng):** Chấm điểm định lượng từng tiêu chuẩn (Technical, On-Page, Core Web Vitals, AEO, GEO, Sức khỏe trung bình đa trang) và tính toán điểm tổng hợp (thang 100).
* 🕵️ **Reviewer-AI (Giám Đốc Thẩm Định & Phản Biện):** Phân tích mức độ nghiêm trọng (*CRITICAL, HIGH, MEDIUM, LOW*). Nếu phát hiện lỗi Critical hoặc điểm chưa đạt ngưỡng chuẩn (Quality Gate), Reviewer-AI sẽ **TỪ CHỐI DUYỆT (REJECTED)** và phát vé yêu cầu khắc phục (Remediation Ticket).
* 🧪 **Tester-AI (Kiểm Thử Tự Động CI/CD):** Chạy kiểm thử tự động trên bản vá:
  * Kiểm thử cú pháp server block Nginx 301 và lệnh `return 301`.
  * Parse và kiểm định JSON-LD Schema theo chuẩn Schema.org (@context, @graph).
  * Giả lập phản hồi 3 bot AI (*Googlebot vs GPTBot vs PerplexityBot*).
  * Kiểm thử mã HTTP phản hồi của các bài viết con.

### 2. Vòng Lặp Phản Hồi Tự Chữa Lành (Self-Healing Feedback Loop):
```
[Vòng lặp 1: Chẩn đoán]
      │
      ▼
Specialist-AI (Crawl & Bóc tách)
      │
      ▼
Scorer-AI (Chấm điểm: VD 74/100)
      │
      ▼
Reviewer-AI (Phát hiện lỗi Critical ➔ TỪ CHỐI NGHIỆM THU)
      │
      ▼
Tester-AI (Xác nhận lỗi Domain Split & Thiếu Schema)
      │
      ▼
🔄 KÍCH HOẠT VÒNG LẶP #2 (TỰ ĐỘNG CHỮA LÀNH)
      │
      ▼
Specialist-AI (Sinh bản vá: Nginx 301, Schema JSON-LD, Robots, llms.txt)
      │
      ▼
Tester-AI (Kiểm thử cú pháp bản vá ➔ 100% SYNTAX & SPEC PASS)
      │
      ▼
Scorer-AI (Cộng điểm cải tiến sau vá lỗi ➔ 98/100!)
      │
      ▼
Reviewer-AI (🎉 PHÊ DUYỆT NGHIỆM THU - QUALITY GATE PASSED!)
```

### 3. Đào Sâu Toàn Site & Nhiều Bài Viết (Multi-Page & Sitemap Matrix):
* Tự động khám phá toàn bộ URL từ `sitemap.xml` và các liên kết nội bộ `<a href>`.
* Quét song song đa luồng từ 5 đến 15+ bài viết/trang con.
* **Ma trận phân tích lỗi chéo (Cross-Page Analytics):**
  * **Keyword Cannibalization:** Bắt lỗi các bài viết có tiêu đề hoặc Heading trùng lặp trên 75% tự triệt tiêu PageRank của nhau.
  * **Duplicate Metadata:** Phát hiện các trang dùng chung Title hoặc Meta Description.
  * **Thin Content Detector:** Cảnh báo bài viết dưới 300 từ.
  * **Bảng chi tiết từng bài viết:** URL, Tiêu đề, H1, Số lượng từ, Loại Schema, Điểm chất lượng từng trang.

---

## 🛠️ Cách Khởi Động Nhanh

### Cách 1: Chạy file Batch 1-Click (Windows)
Nhấp đúp chuột vào file:
👉 **[`run_app.bat`](./run_app.bat)**

Trình duyệt sẽ tự động mở tại địa chỉ: `http://localhost:8888`

### Cách 2: Chạy dòng lệnh
```bash
cd "d:\Download\test antigravity\seo-master-suite"
python server.py
```
Sau đó mở trình duyệt truy cập: `http://localhost:8888`
