import { motion } from 'framer-motion';
import { Shield, MapPin, Zap, AlertCircle, TrendingUp, Users, HeartPulse, ShieldCheck, Activity, Globe, Zap as ZapIcon, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    { icon: Shield, title: 'Smart SOS', desc: 'Instant one-tap emergency alerts with live location tracking and automated responder dispatch.' },
    { icon: MapPin, title: 'Nearby Services', desc: 'Precision mapping of 10,000+ verified hospitals, police stations, and specialized trauma units.' },
    { icon: Zap, title: 'AI Risk Prediction', desc: 'Advanced neural networks analyze traffic, weather, and historical data to predict accident hotspots.' },
    { icon: AlertCircle, title: 'Community Hazards', desc: 'Real-time crowdsourced reporting for potholes, construction, and localized road dangers.' },
    { icon: TrendingUp, title: 'Live Analytics', desc: 'Comprehensive data dashboard showing traffic volume, congestion indices, and safety metrics.' },
    { icon: HeartPulse, title: 'Medical Integration', desc: 'Sync your emergency medical profile with responders for faster, personalized life-saving care.' },
  ];

  const missionItems = [
    { icon: Globe, title: 'Universal Access', desc: 'Safety shouldn\'t be a luxury. Our tools are free for all road users.' },
    { icon: ZapIcon, title: 'Zero Latency', desc: 'Engineered for speed. SOS alerts reach responders in under 3 seconds.' },
    { icon: ShieldCheck, title: 'Data Privacy', desc: 'Your location is only shared during active emergencies. Security is paramount.' },
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <div className="badge">🚀 ResQRoute — Next-Gen Road Safety</div>
          <h1>Securing Every Journey with <span>AI-Powered</span> Intelligence</h1>
          <p>
            Experience the future of emergency response. ResQRoute bridges the gap between 
            accidents and assistance using real-time predictive analytics and a global safety network.
          </p>
          <div className="hero-btns">
            <Link to="/dashboard" className="btn btn-primary">Launch Command Center</Link>
            <Link to="/insights" className="btn btn-secondary">Predictive Insights</Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hero-image"
        >
          <img src="/src/assets/hero.png" alt="Safety Visualization" />
          <div className="glow-orb"></div>
          <div className="floating-stat glass-card">
            <Activity size={20} color="var(--accent-red)" />
            <div>
              <span className="val">98%</span>
              <span className="lab">Dispatch Rate</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="stats-section glass-card">
        <div className="stat-item">
          <Clock size={32} color="var(--accent-blue)" />
          <div>
            <h4>2.4s</h4>
            <p>Avg. SOS Response</p>
          </div>
        </div>
        <div className="stat-item">
          <Users size={32} color="var(--accent-green)" />
          <div>
            <h4>10k+</h4>
            <p>Active Responders</p>
          </div>
        </div>
        <div className="stat-item">
          <ShieldCheck size={32} color="var(--accent-purple)" />
          <div>
            <h4>99.9%</h4>
            <p>Uptime Reliability</p>
          </div>
        </div>
        <div className="stat-item">
          <TrendingUp size={32} color="var(--accent-red)" />
          <div>
            <h4>40%</h4>
            <p>Accident Reduction</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section">
        <div className="section-header">
          <h2>Core Capabilities</h2>
          <p>A multi-layered approach to modernizing road safety and emergency coordination.</p>
        </div>
        <div className="features-container">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, borderColor: 'var(--accent-blue)' }}
              className="feature-card glass-card"
            >
              <div className="feature-icon"><f.icon /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission / Value Props */}
      <section className="mission-section">
        <div className="mission-content">
          <div className="section-header align-left">
            <h2>Why ResQRoute?</h2>
            <p>Our commitment to building a safer, more connected road network for the 2030 vision.</p>
          </div>
          <div className="mission-grid">
            {missionItems.map((m, i) => (
              <div key={i} className="mission-item">
                <div className="m-icon"><m.icon size={24} /></div>
                <div className="m-text">
                  <h4>{m.title}</h4>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mission-visual glass-card">
          <div className="visual-header">
            <Shield size={20} color="var(--accent-red)" />
            <span>Emergency Protocol V4.2</span>
          </div>
          <div className="visual-body">
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="footer-cta glass-card">
        <div className="cta-content">
          <h2>Ready to revolutionize road safety?</h2>
          <p>Join the ResQRoute ecosystem and help us achieve the "Zero Accident" goal.</p>
          <div className="footer-btns">
            <Link to="/dashboard" className="btn btn-primary">Open Command Center</Link>
            <button className="btn btn-secondary">Partner With Us</button>
          </div>
        </div>
        <div className="footer-links">
          <div className="link-col">
            <h5>Platform</h5>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/insights">Safety Insights</Link>
            <Link to="/sos">Emergency SOS</Link>
          </div>
          <div className="link-col">
            <h5>Legal</h5>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
          <div className="link-col">
            <h5>Connect</h5>
            <span>Twitter</span>
            <span>GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
