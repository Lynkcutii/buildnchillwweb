package com.buildnchill.shop;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Minecraft Shop Plugin
 * Poll Supabase REST API để lấy orders và thực thi commands
 * 
 * @author BuildnChill
 * @version 1.0.0
 */
public class MinecraftShopPlugin extends JavaPlugin {
    
    private static final Logger logger = Logger.getLogger("MinecraftShopPlugin");
    
    // Cấu hình - THAY ĐỔI CÁC GIÁ TRỊ NÀY
    private String supabaseUrl = "https://byaxtcrajucaifflanmd.supabase.co";
    private String supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YXh0Y3JhanVjYWlmZmxhbm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjAwNDQsImV4cCI6MjA4MjczNjA0NH0.H7Q33o_KJMH3ZqoAZWyz5Mh67rBZjLLz74iQGrIsh9g";
    private String discordWebhookUrl = "https://discord.com/api/webhooks/1458351729023254529/TldcZM4HKMyELK9ZICAO8WXQDcG6vqCtYeSXJZ7NqXRWf1fZP_MRAjfjfkx-qgOrLJgS";
    private int pollInterval = 15; // Giây (10-20 giây)
    
    private BukkitTask pollTask;
    private final java.util.Set<String> processedIds = java.util.Collections.synchronizedSet(new java.util.HashSet<>());
    
    @Override
    public void onEnable() {
        // Load config từ config.yml
        saveDefaultConfig();
        reloadConfig();
        supabaseUrl = getConfig().getString("supabase.url", supabaseUrl);
        supabaseAnonKey = getConfig().getString("supabase.anon_key", supabaseAnonKey);
        discordWebhookUrl = getConfig().getString("discord.webhook_url", discordWebhookUrl);
        pollInterval = getConfig().getInt("poll.interval_seconds", pollInterval);
        
        // Bắt đầu polling task
        startPolling();
        
        logger.info("Minecraft Shop Plugin (Silent Mode) đã sẵn sàng!");
    }
    
    @Override
    public void onDisable() {
        if (pollTask != null && !pollTask.isCancelled()) {
            pollTask.cancel();
        }
        logger.info("Minecraft Shop Plugin đã tắt.");
    }
    
    /**
     * Bắt đầu polling Supabase mỗi N giây
     */
    private void startPolling() {
        pollTask = Bukkit.getScheduler().runTaskTimerAsynchronously(
            this,
            this::pollSupabase,
            0L, // Delay ban đầu (0 = chạy ngay)
            pollInterval * 20L // Convert giây sang ticks (1 giây = 20 ticks)
        );
    }
    
    /**
     * Poll Supabase để lấy pending_commands
     */
    private void pollSupabase() {
        try {
            List<Order> commands = fetchPendingCommands();
            if (commands.isEmpty()) return;
            
            for (Order cmd : commands) {
                if (processedIds.contains(cmd.getId())) continue;
                executeCommand(cmd);
            }
        } catch (Exception e) {
            // Im lặng
        }
    }
    
    /**
     * Fetch pending_commands từ Supabase REST API
     */
    private List<Order> fetchPendingCommands() throws Exception {
        String apiUrl = supabaseUrl + "/rest/v1/pending_commands?status=eq.pending&order=created_at.asc";
        
        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("apikey", supabaseAnonKey);
        conn.setRequestProperty("Authorization", "Bearer " + supabaseAnonKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Prefer", "return=representation");
        
        int responseCode = conn.getResponseCode();
        
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new Exception("HTTP Error: " + responseCode + " - " + conn.getResponseMessage());
        }
        
        // Đọc response
        StringBuilder response = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
        }
        
        // Parse JSON
        return parseCommandsJson(response.toString());
    }
    
    /**
     * Parse JSON response từ pending_commands
     * Sử dụng regex để tách các object JSON một cách an toàn hơn
     */
    private List<Order> parseCommandsJson(String json) {
        List<Order> commands = new ArrayList<>();
        
        try {
            json = json.trim();
            if (!json.startsWith("[") || !json.endsWith("]")) {
                return commands;
            }
            
            // Xóa dấu [ ] ở hai đầu
            String content = json.substring(1, json.length() - 1).trim();
            if (content.isEmpty()) return commands;

            // Tách các object bằng regex: tìm các cụm { ... } 
            // Lưu ý: Đây là giải pháp tạm thời nếu không muốn dùng thư viện GSON
            // Ở đây tôi sẽ dùng cách an toàn hơn để trích xuất dữ liệu
            List<String> objects = new ArrayList<>();
            int braceCount = 0;
            StringBuilder currentObj = new StringBuilder();
            boolean inQuotes = false;

            for (int i = 0; i < content.length(); i++) {
                char c = content.charAt(i);
                if (c == '\"' && (i == 0 || content.charAt(i-1) != '\\')) {
                    inQuotes = !inQuotes;
                }
                
                if (!inQuotes) {
                    if (c == '{') braceCount++;
                    if (c == '}') braceCount--;
                }
                
                currentObj.append(c);
                
                if (braceCount == 0 && c == '}' && currentObj.length() > 0) {
                    objects.add(currentObj.toString());
                    currentObj = new StringBuilder();
                    // Bỏ qua dấu phẩy giữa các object
                    while (i + 1 < content.length() && (content.charAt(i+1) == ',' || Character.isWhitespace(content.charAt(i+1)))) {
                        i++;
                    }
                }
            }

            for (String objStr : objects) {
                Order cmd = new Order();
                // Trích xuất các field bằng regex để tránh bị lỗi bởi dấu phẩy bên trong giá trị
                cmd.setId(extractJsonValue(objStr, "id"));
                cmd.setCommand(extractJsonValue(objStr, "command"));
                cmd.setMcUsername(extractJsonValue(objStr, "mc_username"));
                cmd.setStatus(extractJsonValue(objStr, "status"));
                cmd.setDiscordMessageId(extractJsonValue(objStr, "discord_message_id"));
                
                if (cmd.getId() != null && cmd.getCommand() != null) {
                    commands.add(cmd);
                }
            }
            
        } catch (Exception e) {
            logger.log(Level.WARNING, "Lỗi parse JSON: " + e.getMessage(), e);
        }
        
        return commands;
    }

    /**
     * Helper để trích xuất giá trị từ chuỗi JSON đơn giản
     */
    private String extractJsonValue(String json, String key) {
        // Regex xử lý chuỗi có chứa escaped quotes: "key": "value\"with\"quotes"
        String pattern = "\"" + key + "\":\\s*\"((?:\\\\.|[^\\\\\"])*)\"";
        java.util.regex.Pattern r = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher m = r.matcher(json);
        if (m.find()) {
            String value = m.group(1);
            // Unescape các ký tự: \" -> ", \\ -> \
            return value.replace("\\\"", "\"").replace("\\\\", "\\");
        }
        // Thử trường hợp không có dấu ngoặc kép (cho số hoặc null)
        pattern = "\"" + key + "\":\\s*([^,}\\]\\s]*)";
        r = java.util.regex.Pattern.compile(pattern);
        m = r.matcher(json);
        if (m.find()) {
            String val = m.group(1).replace("\"", "");
            return val.equals("null") ? null : val;
        }
        return null;
    }
    
    /**
     * Xử lý một command: thực thi và update Supabase
     */
    private void executeCommand(Order cmd) {
        Bukkit.getScheduler().runTask(this, () -> {
            try {
                if (Bukkit.getPlayerExact(cmd.getMcUsername()) == null) return;
                
                // Chặn lặp lại ngay lập tức
                if (!processedIds.add(cmd.getId())) return;

                String command = cmd.getCommand().trim();
                if (command.contains("{user_name}")) command = command.replace("{user_name}", cmd.getMcUsername());
                if (command.contains("{username}")) command = command.replace("{username}", cmd.getMcUsername());
                
                boolean success = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command);
                
                if (success && !command.startsWith("tellraw")) {
                    logger.info("✅ Đã giao vật phẩm thành công cho: " + cmd.getMcUsername());
                }

                deleteCommand(cmd);
            } catch (Exception e) {
                deleteCommand(cmd);
            }
        });
    }
    
    /**
     * Xóa command khỏi Supabase im lặng
     */
    private void deleteCommand(Order cmd) {
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL(supabaseUrl + "/rest/v1/pending_commands?id=eq." + cmd.getId());
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("DELETE");
                conn.setRequestProperty("apikey", supabaseAnonKey);
                conn.setRequestProperty("Authorization", "Bearer " + supabaseAnonKey);
                conn.getResponseCode(); // Execute delete
            } catch (Exception ignored) {}
        });
    }
    
    /**
     * Inner class để lưu thông tin Order
     */
    private static class Order {
        private String id;
        private String mcUsername;
        private String product;
        private String command;
        private String status;
        private String notes;
        private double price;
        private boolean delivered;
        private String discordMessageId;
        
        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getMcUsername() { return mcUsername; }
        public void setMcUsername(String mcUsername) { this.mcUsername = mcUsername; }
        
        public String getProduct() { return product; }
        public void setProduct(String product) { this.product = product; }
        
        public String getCommand() { return command; }
        public void setCommand(String command) { this.command = command; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        
        public boolean isDelivered() { return delivered; }
        public void setDelivered(boolean delivered) { this.delivered = delivered; }

        public String getDiscordMessageId() { return discordMessageId; }
        public void setDiscordMessageId(String discordMessageId) { this.discordMessageId = discordMessageId; }
    }
}

