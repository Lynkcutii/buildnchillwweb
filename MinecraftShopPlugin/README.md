# Minecraft Shop Plugin

Plugin tự động xử lý orders từ Supabase và thực thi commands trong game Minecraft.

## Yêu Cầu

- **Minecraft Server**: Paper hoặc Spigot 1.20+
- **Java**: 17+
- **Maven**: 3.6+ (để build)

## Build Plugin

```bash
mvn clean package
```

File JAR sẽ được tạo tại: `target/MinecraftShopPlugin-1.0.0.jar`

## Cài Đặt

1. Copy file JAR vào thư mục `plugins` của server
2. Restart server
3. Chỉnh sửa `plugins/MinecraftShopPlugin/config.yml`
4. Reload: `/reload` hoặc restart server

## Cấu Hình

Mở file `plugins/MinecraftShopPlugin/config.yml`:

```yaml
supabase:
  url: "https://your-project.supabase.co"
  anon_key: "your-anon-key"

poll:
  interval_seconds: 15  # 10-20 giây
```

## Cách Hoạt Động

1. Plugin poll Supabase mỗi N giây (theo `interval_seconds`)
2. Lấy tất cả orders có `status='paid'` và `delivered=false`
3. Với mỗi order:
   - Thực thi command trong game
   - Update order: `delivered=true`, `status='delivered'`
4. Tránh xử lý trùng bằng cách lưu ID đã xử lý

## Logs

Plugin ghi logs vào console server:
- `INFO`: Thông tin bình thường
- `WARNING`: Cảnh báo
- `SEVERE`: Lỗi nghiêm trọng

## Troubleshooting

Xem file `MINECRAFT_SHOP_GUIDE.md` trong thư mục gốc project.

