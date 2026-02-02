import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { slugify } from '../utils/helpers';

const DataContext = createContext();

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
    maxPlayers: '500',
    version: '1.20.4'
  });
  const [contacts, setContacts] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    server_ip: 'buildnchill.id.vn',
    server_version: '1.20.4',
    contact_email: 'admin@buildnchill.vn',
    contact_phone: '',
    discord_url: '',
    site_title: 'BuildnChill',
    maintenance_mode: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      return null;
    }
    try {
      // Sử dụng select().eq().maybeSingle() để tránh lỗi nếu chưa có profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      const fullProfile = profileData ? {
        ...profileData,
        wallet_balance: walletData?.balance || 0
      } : null;

      setUserProfile(fullProfile);
      return fullProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  const login = async (username, password) => {
    try {
      const email = `${username.toLowerCase().trim()}@buildnchill.vn`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const email = `${username.toLowerCase().trim()}@buildnchill.vn`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadData = async (profile) => {
    try {
      const newsPromise = supabase.from('news').select('*').eq('is_deleted', false).order('date', { ascending: false });
      const settingsPromise = supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
      const statusPromise = supabase.from('server_status').select('*').eq('id', 1).maybeSingle();

      const [newsRes, settingsRes, statusRes] = await Promise.all([newsPromise, settingsPromise, statusPromise]);

      if (newsRes.data) setNews(newsRes.data.map(item => ({ ...item, slug: item.slug || slugify(item.title) })));
      if (settingsRes.data) {
        setSiteSettings(settingsRes.data);
        // Sau khi có settings (đặc biệt là server_ip), thử cập nhật trạng thái thực tế
        refreshMinecraftStatus(settingsRes.data.server_ip, profile);
      }
      if (statusRes.data) setServerStatus({ 
        status: statusRes.data.status, 
        players: statusRes.data.players, 
        maxPlayers: statusRes.data.max_players, 
        version: statusRes.data.version 
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const refreshMinecraftStatus = async (ip, profile) => {
    const activeProfile = profile || userProfile;
    const serverIp = ip || siteSettings?.server_ip || 'buildnchill.id.vn';
    try {
      const response = await fetch(`https://api.mcsrvstat.us/3/${serverIp}`);
      const data = await response.json();
      
      console.log('MC API Response:', data);

      if (data && data.online !== undefined) {
        const newStatus = {
          status: data.online ? 'Online' : 'Offline',
          players: data.players?.online?.toString() || '0',
          max_players: data.players?.max?.toString() || '500',
          version: data.version || '1.20.4'
        };

        setServerStatus({
          status: newStatus.status,
          players: newStatus.players,
          maxPlayers: newStatus.max_players,
          version: newStatus.version
        });

        // Chỉ Admin mới được quyền ghi đè trạng thái lên Database để tránh xung đột
        if (activeProfile?.role === 'admin') {
          await supabase.from('server_status').update(newStatus).eq('id', 1);
        }
      }
    } catch (error) {
      console.error('Error fetching Minecraft status:', error);
    }
  };

  useEffect(() => {
    let authSubscription = null;
    let statusInterval = null;

    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      let currentProfile = null;
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        currentProfile = await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
      }
      
      await loadData(currentProfile);
      setLoading(false);

      // Tự động làm mới trạng thái server mỗi 2 phút
      statusInterval = setInterval(() => {
        refreshMinecraftStatus();
      }, 120000);

      // Thiết lập listener sau khi đã init xong
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && currentUser)) {
          setUser(currentUser);
          setIsAuthenticated(true);
          await fetchUserProfile(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setUserProfile(null);
        }
        setLoading(false);
      });
      authSubscription = data.subscription;
    };

    initializeAuth();

    // Real-time subscriptions cho dữ liệu
    const newsChannel = supabase.channel('news_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
      supabase.from('news').select('*').eq('is_deleted', false).order('date', { ascending: false }).then(({ data }) => {
        if (data) setNews(data.map(item => ({ ...item, slug: item.slug || slugify(item.title) })));
      });
    }).subscribe();

    const statusChannel = supabase.channel('status_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'server_status' }, (payload) => {
      if (payload.new) {
        setServerStatus({
          status: payload.new.status,
          players: payload.new.players,
          maxPlayers: payload.new.max_players,
          version: payload.new.version
        });
      }
    }).subscribe();

    const walletChannel = supabase.channel('wallet_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, (payload) => {
      // Cập nhật profile nếu là ví của user hiện tại
      const currentUserId = user?.id;
      if (currentUserId && (payload.new.user_id === currentUserId || payload.old?.user_id === currentUserId)) {
        fetchUserProfile(currentUserId);
      }
      // Thông báo cho các trang quản trị ví
      window.dispatchEvent(new CustomEvent('wallet_updated'));
    }).subscribe();

    // Thêm listener cho recharges để cập nhật danh sách tự động nếu đang ở trang quản trị
    const rechargeChannel = supabase.channel('recharge_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'recharges' }, () => {
      // Phát sự kiện custom để các component biết mà fetch lại
      window.dispatchEvent(new CustomEvent('recharge_updated'));
    }).subscribe();

    // Thêm listener cho orders
    const orderChannel = supabase.channel('order_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      window.dispatchEvent(new CustomEvent('orders_updated'));
    }).subscribe();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      if (statusInterval) clearInterval(statusInterval);
      supabase.removeChannel(newsChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(rechargeChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [user?.id, siteSettings?.server_ip]);

  return (
    <DataContext.Provider value={{
      news, serverStatus, contacts, siteSettings,
      isAuthenticated, user, userProfile, loading,
      fetchUserProfile, login, register, logout, refreshMinecraftStatus
    }}>
      {children}
    </DataContext.Provider>
  );
};
