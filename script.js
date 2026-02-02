document.addEventListener('DOMContentLoaded', function() {
    const tiktokUrlInput = document.getElementById('tiktokUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const resultArea = document.getElementById('resultArea');
    const videoPreview = document.getElementById('videoPreview');
    const directDownloadLink = document.getElementById('directDownloadLink');
    const resetBtn = document.getElementById('resetBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorText = document.getElementById('errorText');

    // Sử dụng một CORS Proxy miễn phí và công khai (có thể cần thay đổi nếu bị lỗi)
    const CORS_PROXY = "https://api.allorigins.win/raw?url=";

    // API công khai miễn phí - SSSTikTok
    const DOWNLOADER_API_URL = "https://ssstik.io/abc?url=dl";

    downloadBtn.addEventListener('click', async function() {
        const url = tiktokUrlInput.value.trim();

        if (!url || !url.includes('tiktok.com')) {
            showError('Vui lòng dán một đường link TikTok hợp lệ.');
            return;
        }

        // Hiển thị trạng thái loading, ẩn kết quả cũ và lỗi
        loading.style.display = 'block';
        resultArea.style.display = 'none';
        error.style.display = 'none';

        try {
            // Bước 1: Gửi yêu cầu đến SSSTikTok để lấy trang HTML chứa thông tin video
            const formData = new FormData();
            formData.append('id', url); // SSSTikTok chờ tham số 'id' là link TikTok

            const response = await fetch(CORS_PROXY + encodeURIComponent(DOWNLOADER_API_URL), {
                method: 'POST',
                body: formData,
                // Gửi header giả lập trình duyệt
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://ssstik.io',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache',
                }
            });

            const htmlString = await response.text();

            // Bước 2: Phân tích HTML để tìm link tải video không watermark
            // Link thường nằm trong thẻ <a> với thuộc tính href chứa ".mp4"
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // Tìm tất cả các thẻ <a> và lọc lấy link mp4
            const allLinks = doc.querySelectorAll('a');
            let videoDownloadUrl = null;

            for (let link of allLinks) {
                const href = link.getAttribute('href');
                if (href && href.includes('.mp4') && !href.includes('watermark')) {
                    videoDownloadUrl = href;
                    break; // Lấy link đầu tiên tìm thấy
                }
            }

            // Nếu không tìm thấy theo cách trên, thử tìm trong các thẻ <script> hoặc <source>
            if (!videoDownloadUrl) {
                const sourceTags = doc.querySelectorAll('source');
                for (let source of sourceTags) {
                    const src = source.getAttribute('src');
                    if (src && src.includes('.mp4')) {
                        videoDownloadUrl = src;
                        break;
                    }
                }
            }

            if (!videoDownloadUrl) {
                // Cấu trúc HTML có thể đã thay đổi -> Cần cập nhật logic phân tích
                throw new Error('Không thể tìm thấy link video. Công cụ miễn phí có thể đã thay đổi. Vui lòng thử lại hoặc dùng công cụ khác (SnapTik/TikMate).');
            }

            // Đảm bảo link là URL đầy đủ
            if (!videoDownloadUrl.startsWith('http')) {
                videoDownloadUrl = 'https://ssstik.io' + videoDownloadUrl;
            }

            // Bước 3: Hiển thị kết quả
            videoPreview.src = videoDownloadUrl;
            directDownloadLink.href = videoDownloadUrl;

            // Ẩn loading, hiển thị kết quả
            loading.style.display = 'none';
            resultArea.style.display = 'block';

        } catch (err) {
            console.error('Lỗi khi xử lý video:', err);
            loading.style.display = 'none';
            showError(`Đã xảy ra lỗi: ${err.message}. Vui lòng thử lại với một video khác hoặc kiểm tra kết nối mạng.`);
        }
    });

    // Nút "Xử lý Video Khác"
    resetBtn.addEventListener('click', function() {
        tiktokUrlInput.value = '';
        videoPreview.src = '';
        directDownloadLink.href = '#';
        resultArea.style.display = 'none';
        error.style.display = 'none';
        tiktokUrlInput.focus();
    });

    // Hàm hiển thị thông báo lỗi
    function showError(message) {
        errorText.textContent = message;
        error.style.display = 'block';
    }

    // Cho phép nhấn Enter để gửi
    tiktokUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
});
