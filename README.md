# Hien’s Nha — Nhà của Hiển

Website cá nhân: tri thức, truyện, âm nhạc/video, hình ảnh, Sổ lưu bút và **Tiệm Nhờ Vả**. VI mặc định, EN chung dữ liệu. Source `sugia279/hiens-nha`, GitHub Pages; Astro static, chưa có backend/DB riêng.

**Bắt đầu từ [Sổ tay dự án hiện tại](docs/project/README.md).**

- [Chức năng và business contracts](docs/project/business.md)
- [Architecture và diagrams](docs/project/architecture.md)
- [Cấu trúc source](docs/project/structure.md)
- [Tiệm Nhờ Vả: gửi, duyệt, trạng thái và kết quả](docs/project/requests.md)
- [Tự phát triển / giao việc cho AI / kiểm thử / xử lý sự cố](docs/project/development.md)
- [AGENTS.md](AGENTS.md): hướng dẫn cho AI làm việc trong repository.

Chạy local: Node theo `.nvmrc`, `npm ci`, `npm run dev`, mở URL với base `/hiens-nha/`. CI kiểm tra PR; main và archive workflow thành công triển khai lên Pages.

Các tài liệu `01_Architecture.md`–`09_DeploymentGuide.md` là thiết kế baseline ban đầu. Bộ `docs/project/` mô tả implementation hiện tại và là entry point cho thay đổi mới. [ADR 0001](docs/decisions/0001-public-personal-knowledge-garden-and-knowledge-graph.md) lưu quyết định nền tảng; thêm ADR mới khi thay kiến trúc hoặc quyền truy cập.
