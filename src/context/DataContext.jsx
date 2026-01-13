import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mockData from '../data/mockData.json';
import { slugify } from '../utils/helpers';

const DataContext = createContext();

const categoryLabels = {
  'report': 'Báo Cáo (Report)',
  'help': 'Trợ Giúp (Help)',
  'bug': 'Báo Lỗi (Bug)',
  'suggestion': 'Đề Xuất (Suggestion)',
  'other': 'Khác (Other)'
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [news, setNews] = useState([]);
  const [serverStatus, setServerStatus] = useState({
    status: 'Online',
    players: '0',
    maxPlayers: '20',
    version: '1.21.4'
  });
  const [contacts, setContacts] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    server_ip: 'buildnchill.id.vn:25190',
    server_version: '> 1.21.4',
    contact_email: 'apphoang2004@gmail.com',
    contact_phone: '+84 373 796 601',
    discord_url: 'https://discord.gg/buildnchill',
    site_title: 'BuildnChill',
    maintenance_mode: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured. Real-time updates disabled.');
      return;
    }

    let newsSubscription, statusSubscription, contactsSubscription, settingsSubscription;

    try {
      newsSubscription = supabase
        .channel('news_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'news' },
          () => {
            loadNews();
          }
        )
        .subscribe();

      statusSubscription = supabase
        .channel('status_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'server_status' },
          () => {
            loadServerStatus();
          }
        )
        .subscribe();

      contactsSubscription = supabase
        .channel('contacts_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'contacts' },
          () => {
            loadContacts();
          }
        )
        .subscribe();

      settingsSubscription = supabase
        .channel('settings_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          () => {
            loadSiteSettings();
            setTimeout(() => loadServerStatus(), 1000);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }

    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadContacts();
    }
    const serverStatusInterval = setInterval(() => {
      loadServerStatus();
    }, 20000); // Update every 20 seconds for more frequent updates

    return () => {
      if (newsSubscription) newsSubscription.unsubscribe();
      if (statusSubscription) statusSubscription.unsubscribe();
      if (contactsSubscription) contactsSubscription.unsubscribe();
      if (settingsSubscription) settingsSubscription.unsubscribe();
      clearInterval(serverStatusInterval);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated]);

  // Reload server status when server IP changes
  useEffect(() => {
    if (siteSettings?.server_ip) {
      console.log('Server IP changed, reloading server status:', siteSettings.server_ip);
      loadServerStatus();
    }
  }, [siteSettings?.server_ip]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNews(),
        loadSiteSettings()
      ]);
      await loadServerStatus();
    } catch (error) {
      console.error('Error loading data:', error);
      // Removed mockData fallbacks to prevent unwanted placeholder content
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedNews = data.map(item => ({
          id: item.id,
          title: item.title,
          slug: item.slug || slugify(item.title) || item.id.toString(),
          description: item.description,
          content: item.content,
          image: item.image,
          date: item.date
        }));
        setNews(formattedNews);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      setNews([]);
    }
  };
  const fetchMinecraftServerStatus = async (serverIp) => {
    try {
      if (!serverIp || !serverIp.trim()) {
        console.warn('Server IP is empty, skipping fetch');
        return null;
      }

      const trimmedIp = serverIp.trim();
      const parts = trimmedIp.split(':');
      const ip = parts[0];
      const port = parts[1] || '25190';

      // Construct URL properly - mcstatus.io format: ip:port
      const serverAddress = port === '25190' ? ip : `${ip}:${port}`;
      const url = `https://api.mcstatus.io/v2/status/java/${serverAddress}`;

      console.log('Fetching server status from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        console.error(`API returned ${response.status}: ${response.statusText}`);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Server status API response:', data);

      // Check if response contains error
      if (data.error) {
        console.error('API returned error:', data.error);
        return null; // Return null to fallback to database
      }

      if (data && data.online === true) {
        // Try multiple possible field names for players count
        const players = data.players?.online ??
          data.players?.now ??
          data.players?.current ??
          (typeof data.players === 'number' ? data.players : 0) ??
          0;

        // Try multiple possible field names for max players
        const maxPlayers = data.players?.max ??
          data.max_players ??
          (typeof data.maxPlayers === 'number' ? data.maxPlayers : 500) ??
          500;

        // Try multiple possible field names for version
        const version = data.version?.name_clean ??
          data.version?.name ??
          data.version?.name_raw ??
          (typeof data.version === 'string' ? data.version : null) ??
          'Unknown';

        return {
          status: 'Online',
          players: Math.max(0, parseInt(players) || 0), // Ensure non-negative integer
          maxPlayers: Math.max(1, parseInt(maxPlayers) || 500), // Ensure at least 1
          version: version
        };
      } else {
        // Server is offline
        return {
          status: 'Offline',
          players: 0,
          maxPlayers: 500,
          version: 'Unknown'
        };
      }
    } catch (error) {
      console.error('Error fetching Minecraft server status:', error);
      // Return null instead of offline status to allow fallback to database
      return null;
    }
  };
  const loadServerStatus = async () => {
    try {
      let currentStatus = {
        status: 'Online',
        players: '0',
        maxPlayers: '500',
        version: '1.20.4'
      };

      // Try to load from database first
      try {
        const { data, error } = await supabase
          .from('server_status')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Row doesn't exist, create it
            const { data: newData, error: insertError } = await supabase
              .from('server_status')
              .insert([{
                id: 1,
                status: 'Online',
                players: '0',
                max_players: '500',
                version: '1.20.4'
              }])
              .select()
              .single();
            if (insertError) {
              console.warn('Error inserting server_status:', insertError);
            } else if (newData) {
              currentStatus = {
                status: newData.status,
                players: newData.players,
                maxPlayers: newData.max_players,
                version: newData.version
              };
            }
          } else {
            console.warn('Error loading server_status from database:', error);
          }
        } else if (data) {
          currentStatus = {
            status: data.status,
            players: data.players,
            maxPlayers: data.max_players,
            version: data.version
          };
        }
      } catch (dbError) {
        console.warn('Database error (using fallback):', dbError);
      }

      // Try to fetch real-time status from Minecraft API
      const serverIp = siteSettings?.server_ip;
      if (serverIp && serverIp.trim()) {
        console.log('Attempting to fetch real-time status for:', serverIp);
        const realTimeStatus = await fetchMinecraftServerStatus(serverIp);

        if (realTimeStatus) {
          // Successfully fetched real-time status
          const updatedStatus = {
            ...currentStatus,
            status: realTimeStatus.status,
            players: realTimeStatus.players.toString(),
            maxPlayers: realTimeStatus.maxPlayers.toString(),
            version: realTimeStatus.version !== 'Unknown' ? realTimeStatus.version : currentStatus.version
          };
          console.log('Updated server status with real-time data:', updatedStatus);
          setServerStatus(updatedStatus);
          return;
        } else {
          console.warn('Failed to fetch real-time status, using database values');
        }
      } else {
        console.warn('Server IP not set in siteSettings, using database values');
      }

      // Fallback to database values
      console.log('Setting server status from database:', currentStatus);
      setServerStatus(currentStatus);
    } catch (error) {
      console.error('Error loading server status:', error);
      setServerStatus({
        status: 'Online',
        players: '0',
        maxPlayers: '500',
        version: '1.20.4'
      });
    }
  };

  const loadContacts = async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setContacts(data);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('site_settings')
            .insert([{
              id: 1,
              server_ip: 'buildnchill.id.vn:25190',
              server_version: '> 1.21.4',
              contact_email: 'apphoang2004@gmail.com',
              contact_phone: '+84 373 796 601',
              discord_url: 'https://discord.gg/buildnchill',
              site_title: 'BuildnChill',
              maintenance_mode: false
            }])
            .select()
            .single();

          if (insertError) throw insertError;

          if (newData) {
            setSiteSettings({
              server_ip: newData.server_ip,
              server_version: newData.server_version,
              contact_email: newData.contact_email,
              contact_phone: newData.contact_phone,
              discord_url: newData.discord_url,
              site_title: newData.site_title,
              maintenance_mode: newData.maintenance_mode
            });
          }
          return;
        }
        throw error;
      }

      if (data) {
        setSiteSettings({
          server_ip: data.server_ip,
          server_version: data.server_version,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          discord_url: data.discord_url,
          site_title: data.site_title,
          maintenance_mode: data.maintenance_mode
        });
      }
    } catch (error) {
      console.error('Error loading site settings:', error);
    }
  };

  const updateSiteSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      setSiteSettings(prev => ({ ...prev, ...newSettings }));

      return true;
    } catch (error) {
      console.error('Error updating site settings:', error);
      alert('Lỗi khi cập nhật cài đặt: ' + error.message);
      return false;
    }
  };

  const addNews = async (newPost) => {
    try {
      const generatedSlug = slugify(newPost.title);
      const { data, error } = await supabase
        .from('news')
        .insert([{
          title: newPost.title,
          slug: generatedSlug,
          description: newPost.description,
          content: newPost.content,
          image: newPost.image,
          date: newPost.date
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedPost = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        image: data.image,
        date: data.date
      };
      setNews(prev => [formattedPost, ...prev].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      ));

      return true;
    } catch (error) {
      console.error('Error adding news:', error);
      alert('Lỗi khi thêm bài viết: ' + error.message);
      return false;
    }
  };

  const updateNews = async (postId, updatedPost) => {
    try {
      const generatedSlug = slugify(updatedPost.title);
      const { error } = await supabase
        .from('news')
        .update({
          title: updatedPost.title,
          slug: generatedSlug,
          description: updatedPost.description,
          content: updatedPost.content,
          image: updatedPost.image,
          date: updatedPost.date,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      const finalPost = { ...updatedPost, slug: generatedSlug };
      setNews(prev => prev.map(post =>
        post.id === postId ? finalPost : post
      ).sort((a, b) => new Date(b.date) - new Date(a.date)));

      return true;
    } catch (error) {
      console.error('Error updating news:', error);
      alert('Lỗi khi cập nhật bài viết: ' + error.message);
      return false;
    }
  };

  const deleteNews = async (postId) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) throw error;

      setNews(prev => prev.filter(post => post.id !== postId));

      return true;
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Lỗi khi xóa bài viết: ' + error.message);
      return false;
    }
  };

  const updateServerStatus = async (status) => {
    try {
      const { error } = await supabase
        .from('server_status')
        .update({
          status: status.status,
          players: status.players,
          max_players: status.maxPlayers,
          version: status.version,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;

      // Update local state, excluding uptime
      const { uptime, ...statusWithoutUptime } = status;
      setServerStatus(prev => ({ ...prev, ...statusWithoutUptime }));

      // Also update site_settings server_version to match
      if (status.version) {
        await supabase
          .from('site_settings')
          .update({ server_version: status.version })
          .eq('id', 1);
      }

      return true;
    } catch (error) {
      console.error('Error updating server status:', error);
      alert('Lỗi khi cập nhật trạng thái server: ' + error.message);
      return false;
    }
  };

  const uploadImage = async (file) => {
    try {
      if (!file) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `contact-images/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('contact-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        // If storage bucket doesn't exist, return null and continue without image
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contact-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1459038651513311301/7iMnd_skBCTXmvvAhnZbmUawTGk1QO7Ft1nXimeKkmbBJQQvg7znZPwkbtrupSpmL9tS';

  const getContactEmbed = (contact, status = 'pending') => {
    const categoryLabel = categoryLabels[contact.category] || contact.category;

    const statusInfo = {
      'pending': { label: '🔴 Đã Nhận (Chờ Xử Lý)', color: 15158332 }, // Red
      'processing': { label: '🟡 Đang Kiểm Tra', color: 16766720 }, // Yellow/Orange
      'resolved': { label: '🟢 Đã Giải Quyết', color: 3066993 } // Green
    }[status] || { label: '🔴 Đã Nhận', color: 15158332 };

    const embed = {
      title: `${statusInfo.label} | LIÊN HỆ: ${categoryLabel || 'Không rõ'}`,
      description: `🔔 **Yêu cầu hỗ trợ từ Website**\n*(Thông tin Email/SĐT đã được ẩn để bảo mật)*`,
      color: statusInfo.color,
      fields: [
        { name: '👤 Người chơi', value: String(contact.ign || 'Không rõ'), inline: true },
        { name: '🏷️ Danh mục', value: String(categoryLabel || 'Khác'), inline: true },
        { name: '📧 Email', value: '`**********@gmail.com`', inline: true },
        { name: '📞 Số điện thoại', value: '`*********`', inline: true },
        { name: '💬 Tin nhắn', value: String(contact.message || 'N/A') }
      ],
      footer: { text: 'BuildnChill Support System' },
      timestamp: new Date(contact.created_at || new Date()).toISOString()
    };

    if (contact.image_url) {
      embed.image = { url: contact.image_url };
    }

    return embed;
  };

  const sendDiscordContactNotification = async (contact) => {
    if (!DISCORD_WEBHOOK_URL) return null;

    try {
      const embed = getContactEmbed(contact, 'pending');

      const response = await fetch(`${DISCORD_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 <@741299302495813662> **CÓ LIÊN HỆ MỚI!**`,
          embeds: [embed]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.id; // Trả về message ID của Discord
      }
      return null;
    } catch (error) {
      console.error('Error sending Discord contact notification:', error);
      return null;
    }
  };

  const submitContact = async (contactData) => {
    try {
      let imageUrl = null;

      // Upload image if provided
      if (contactData.image) {
        imageUrl = await uploadImage(contactData.image);
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ign: contactData.ign,
          email: contactData.email,
          phone: contactData.phone || null,
          category: contactData.category || 'other',
          subject: categoryLabels[contactData.category] || contactData.category || 'Liên Hệ',
          message: contactData.message,
          image_url: imageUrl,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Gửi thông báo Discord và lấy Message ID
      try {
        const discordMsgId = await sendDiscordContactNotification(data);
        if (discordMsgId) {
          await supabase
            .from('contacts')
            .update({ discord_message_id: discordMsgId })
            .eq('id', data.id);
        }
      } catch (discordErr) {
        console.warn('Discord notification partial failure:', discordErr);
      }

      if (isAuthenticated) {
        loadContacts();
      }

      return true;
    } catch (error) {
      console.error('Error submitting contact:', error);
      alert('Lỗi khi gửi liên hệ: ' + error.message);
      return false;
    }
  };

  const markContactAsRead = async (contactId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ read: true })
        .eq('id', contactId);

      if (error) throw error;

      setContacts(prev => prev.map(contact =>
        contact.id === contactId ? { ...contact, read: true } : contact
      ));

      return true;
    } catch (error) {
      console.error('Error marking contact as read:', error);
      return false;
    }
  };

  const updateContactStatus = async (contactId, status) => {
    try {
      const currentContact = contacts.find(c => c.id === contactId);

      const { error } = await supabase
        .from('contacts')
        .update({ status: status })
        .eq('id', contactId);

      if (error) throw error;

      // Update local state
      setContacts(prev => prev.map(contact =>
        contact.id === contactId ? { ...contact, status: status } : contact
      ));

      // Đồng bộ Discord
      if (currentContact?.discord_message_id) {
        try {
          // Luôn cập nhật màu sắc tin nhắn (Edit) thay vì xóa
          const updatedEmbed = getContactEmbed(currentContact, status);
          await fetch(`${DISCORD_WEBHOOK_URL}/messages/${currentContact.discord_message_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [updatedEmbed]
            })
          });
        } catch (discordError) {
          console.error('Error syncing Discord status:', discordError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Lỗi khi cập nhật trạng thái: ' + error.message);
      return false;
    }
  };

  const deleteContact = async (contactId) => {
    try {
      const currentContact = contacts.find(c => c.id === contactId);

      // 1. Xóa tin nhắn trên Discord nếu có
      if (currentContact?.discord_message_id) {
        try {
          await fetch(`${DISCORD_WEBHOOK_URL}/messages/${currentContact.discord_message_id}`, {
            method: 'DELETE'
          });
          console.log('Discord contact message deleted.');
        } catch (discordError) {
          console.error('Error deleting Discord contact message:', discordError);
        }
      }

      // 2. Cập nhật trạng thái xóa mềm trong database
      const { error } = await supabase
        .from('contacts')
        .update({ is_deleted: true })
        .eq('id', contactId);

      if (error) throw error;

      // Update local state
      setContacts(prev => prev.filter(contact => contact.id !== contactId));

      // Reload contacts to ensure consistency with database
      await loadContacts();

      alert('Xóa liên hệ thành công!');
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Lỗi khi xóa liên hệ: ' + error.message);
      return false;
    }
  };

  const login = async (username, password) => {
    if (username === 'BuildnChill-Admin' && password === 'buildnchill2026!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      await loadContacts();
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  const value = {
    news,
    serverStatus,
    contacts,
    siteSettings,
    loading,

    addNews,
    updateNews,
    deleteNews,

    updateServerStatus,

    updateSiteSettings,

    submitContact,
    markContactAsRead,
    updateContactStatus,
    deleteContact,

    isAuthenticated,
    login,
    logout
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
