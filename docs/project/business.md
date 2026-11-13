# Chức năng và business hiện tại

## Các phòng trong nhà

Thứ tự menu chính: Trang chủ → Âm nhạc & Video → Hình ảnh → Dự án → Sổ lưu bút → Tiệm Nhờ Vả → Góc tri thức → Tủ truyện → Về Hiển. Cấu hình tại `src/config/navigation.ts`, dùng chung cho VI/EN và desktop/mobile.

| Chức năng | Hành vi và dữ liệu | Quy tắc phải giữ |
| --- | --- | --- |
| Trang chủ | Giới thiệu, phòng nội dung, ảnh nổi bật, link Tiệm Nhờ Vả | Chỉ ảnh có metadata + `featuredOrder` hiện ở Home; asset đơn lẻ chưa là bài ảnh |
| Left menu / header | Treeview có icon cấp 1–2, tìm kiếm giữa header | Khách mới: nhánh đóng; mở/đóng lưu theo logical path; đổi trang/VI–EN giữ nhánh; chỉ điện thoại ≤767px tự đóng sidebar khi chọn link nội bộ bình thường |
| VI / EN | Trang static mặc định VI và bản `/en/`, chung view/data | Dịch UI; không tự dịch thơ, truyện, mô tả, bình luận, CV. Giữ query/hash khi đổi ngôn ngữ |
| Knowledge authored | Articles, Notes, Projects, Series theo content schema | Draft không xuất bản; references hợp lệ; tags và domains khác nhau; series/order phải đi cùng khi schema yêu cầu |
| Knowledge chia sẻ | Form chọn article/note/poem, chuyên mục, tags, series/order → issue → JSON | `knowledge-approved`; escaped text, giữ xuống dòng; không compile user input thành MDX; nằm trong thư viện Knowledge, không tự nhập vào MDX/graph/topics authored |
| Chuỗi bài | Authored series và nhóm shared series | Shared dùng tên chuỗi chính xác, order số; hai kho lưu khác nhau. Shared series được giới thiệu từ trang Series |
| Tủ truyện | Genres → truyện → chương, link đọc trước/sau | Giữ 84 chương import và URL cũ; không lẫn chương truyện vào danh sách bài kỹ thuật thông thường |
| Music & Video | Biểu diễn của Hiển, Knowledge domain music, nhạc/video được duyệt | Giữ URL `/music/`; `media-approved`; tags/category; URL kiểm tra host; chỉ tạo iframe từ provider đã cho phép, không nhận embed HTML |
| Hình ảnh | Album family/scenery/moments, description; Home dùng featuredOrder | Click mở nền đen, fit và 1:1, phím Escape/đổi ảnh/focus. Owner uploader tạo asset + metadata cùng commit; token chỉ ở bộ nhớ trình duyệt |
| Sổ lưu bút | Lời nhắn và bình luận theo trang | `guestbook-approved`; canonical page context bỏ locale; bình luận được duyệt hiện đúng trang và Sổ; replies trusted theo cơ chế cũ; không chuyển nhầm lời nhắn thành yêu cầu tác nghiệp |
| Tiệm Nhờ Vả | Yêu cầu, mong đợi, ưu tiên tự khai, tags, board/detail/timeline/result | [Contract riêng](requests.md): approval tách acceptance; owner-only updates; completion phải có result |
| Search / Graph | Pagefind HTML index; graph từ authored connections | Shared text tìm được qua trang chứa nó; không coi shared JSON là node graph nếu chưa implement adapter rõ ràng |
| About / Resume / Projects | Giới thiệu, CV iframe, case study | Giữ asset CV, iframe title và links cũ |

## Những khái niệm dễ nhầm

- **Loại** là hình thức nội dung (bài, ghi chú, thơ). **Chuyên mục** là nhóm nghiệp vụ (ví dụ Thơ & sáng tác). **Tag** là nhiều nhãn tự do. **Domain** của MDX là enum giới hạn trong `src/content.config.ts`.
- **Duyệt công khai** là cho phép xuất hiện trên website. **Nhận việc** là cam kết xử lý ở mức nghiệp vụ. `request-approved` không có nghĩa `accepted`.
- Gửi form website chỉ chuẩn bị URL. Khách phải đăng nhập và tạo issue trên GitHub; không có form gửi ẩn danh hay autosave cross-device.
- GitHub issue và file archive là công khai dù chưa duyệt. Gỡ label chỉ rút website sau deployment; không xóa issue, Git history, cache hoặc bản đã được người khác lưu.
- Website là snapshot build. Không có realtime socket, push notification, gửi email tự động, thanh toán, SLA hay DB riêng.

## Tiệm Nhờ Vả là phòng riêng

Sổ lưu bút giữ chức năng chào hỏi/bình luận. Các lời nhắn loại request cũ vẫn ở Sổ theo contract cũ, không tự migrate để tránh mất dữ liệu hoặc đổi quyền duyệt. Trang Home và Sổ dẫn sang Tiệm cho các yêu cầu mới cần theo dõi tiến độ. Một yêu cầu không tự động trở thành project/knowledge; muốn công bố kết quả thành bài viết phải đi qua luồng xuất bản tương ứng.
