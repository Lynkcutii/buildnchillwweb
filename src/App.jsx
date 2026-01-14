import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { DataProvider, useData } from './context/DataContext';
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Contact from './pages/Contact';
import Shop from './pages/Shop';
import Admin from './pages/Admin';
import Login from './pages/Login';
import TetEffect from './components/TetEffect';
import './styles.css';
import './styles/custom.css'
import './styles/carousel.css';
import './styles/shop-tet.css';
import './styles/tet-theme.css';

const AppContent = () => {
  const { isAuthenticated, siteSettings } = useData();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    duration: 0.3,
    ease: 'easeInOut'
  };

  return (
    <div className="App">
      <TetEffect />
      <TopBar />
      <Navbar />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Home />
              </motion.div>
            }
          />
          <Route
            path="/about"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <About />
              </motion.div>
            }
          />
          <Route
            path="/news"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <News />
              </motion.div>
            }
          />
          <Route
            path="/news/:slug"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <NewsDetail />
              </motion.div>
            }
          />
          <Route
            path="/contact"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Contact />
              </motion.div>
            }
          />
          <Route
            path="/shop"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Shop />
              </motion.div>
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/admin" replace />
              ) : (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Login />
                </motion.div>
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Admin />
                </motion.div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </HelmetProvider>
  );
}

export default App;
