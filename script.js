// LƯU Ý QUAN TRỌNG: Thay YOUR_RAPIDAPI_KEY bằng khóa API thực của bạn từ RapidAPI
const RAPIDAPI_KEY = 'YOUR_RAPIDAPI_KEY'; // 👈 THAY ĐỔI DÒNG NÀY

// Các phần tử giao diện
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const resultSection = document.getElementById('resultSection');
const loadingEl = document.getElementById('loading');
const successEl = document.getElementById('success');
const errorEl = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const videoPreview = document.getElementById('videoPreview');
const videoInfo = document.getElementById('videoInfo');
const downloadLink = document.getElementById('downloadLink');

// Hàm kiểm tra URL TikTok hợp lệ
function isValidTikTokUrl(url) {
    const patterns = [
        /https?:\/\/(vm|vt)\.tiktok\.com\/\S+/,
        /https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/,
        /https?:\/\/tiktok\.com\/@[\w.]+\/video\/\d+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}

// Hàm xử lý khi nhấn nút "Tải Video"
downloadBtn.addEventListener('click', processVideo);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processVideo();
});

async function processVideo() {
    const url = urlInput.value.trim();

    // 1. Kiểm tra URL
    if (!url) {
        alert('Vui lòng dán link video TikTok vào ô trống.');
        urlInput.focus();
        return;
    }
    if (!isValidTikTokUrl(url)) {
        alert('Link không hợp lệ. Vui lòng dán link TikTok công khai (dạng vm.tiktok.com/... hoặc tiktok.com/@user/video/...).');
        return;
    }

    // 2. Hiển thị trạng thái "Đang xử lý"
    resetUI();
    resultSection.classList.remove('hidden');
    loadingEl.classList.remove('hidden');

    try {
        // 3. Gọi API để lấy thông tin video
        const videoData = await fetchVideoData(url);

        // 4. Hiển thị kết quả thành công
        displayVideo(videoData);

    } catch (err) {
        // 5. Xử lý lỗi
        showError('Không thể tải video. Lỗi: ' + err.message + '. Vui lòng kiểm tra lại link hoặc thử lại sau.');
        console.error('Lỗi chi tiết:', err);
    }
}

// Hàm gọi API RapidAPI
async function fetchVideoData(tiktokUrl) {
    const encodedUrl = encodeURIComponent(tiktokUrl);
    const apiUrl = `https://tiktok-video-downloader3.p.rapidapi.com/?url=${encodedUrl}`;

    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY, // Sử dụng khóa API từ biến đã khai báo
            'X-RapidAPI-Host': 'tiktok-video-downloader3.p.rapidapi.com'
        }
    };

    const response = await fetch(apiUrl, options);

    if (!response.ok) {
        throw new Error(`API lỗi với mã: ${response.status}`);
    }

    const data = await response.json();
    console.log('Phản hồi từ API:', data); // Kiểm tra trong Console

    // API này trả về dữ liệu trong trường "data"
    if (data && data.data) {
        // Tìm URL video không watermark (thường là playAddr)
        const videoItem = data.data;
        const videoUrl = videoItem.play || videoItem.download || videoItem.videoUrl;

        if (videoUrl) {
            return {
                url: videoUrl,
                author: videoItem.author?.nickname || 'Không rõ',
                description: videoItem.description || 'Không có mô tả',
                duration: videoItem.duration ? `${Math.round(videoItem.duration)} giây` : 'Không rõ'
            };
        } else {
            throw new Error('Không tìm thấy link video trong phản hồi của API.');
        }
    } else {
        throw new Error('Dữ liệu từ API không như mong đợi.');
    }
}

// Hàm hiển thị video và thông tin
function displayVideo(data) {
    loadingEl.classList.add('hidden');

    // Hiển thị video để xem trước
    videoPreview.innerHTML = `
        <video controls>
            <source src="${data.url}" type="video/mp4">
            Trình duyệt của bạn không hỗ trợ tag video.
        </video>
    `;

    // Hiển thị thông tin
    videoInfo.innerHTML = `
        <p><strong>Tác giả:</strong> ${data.author}</p>
        <p><strong>Thời lượng:</strong> ${data.duration}</p>
        <p><strong>Mô tả:</strong> ${data.description.length > 100 ? data.description.substring(0, 100) + '...' : data.description}</p>
    `;

    // Thiết lập link tải
    downloadLink.href = data.url;
    downloadLink.setAttribute('download', `tiktok_${Date.now()}.mp4`);

    successEl.classList.remove('hidden');
}

// Hàm hiển thị thông báo lỗi
function showError(message) {
    loadingEl.classList.add('hidden');
    errorMessage.textContent = message;
    errorEl.classList.remove('hidden');
}

// Hàm đặt lại giao diện
function resetUI() {
    successEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    videoPreview.innerHTML = '';
    videoInfo.innerHTML = '';
}

// Hàm thử lại
window.retryProcess = function() {
    errorEl.classList.add('hidden');
    urlInput.focus();
    urlInput.select();
};
