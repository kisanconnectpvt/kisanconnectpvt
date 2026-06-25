import React from 'react';
import {Link} from 'react-router-dom';
import './Home.css';

const heroCards = [
  {title: 'Farmer dashboard', desc: 'Create and manage products, inventory, and orders with one simple interface.'},
  {title: 'Buyer marketplace', desc: 'Browse fresh produce, add to cart, and place secure orders fast.'},
  {title: 'Live notifications', desc: 'Receive real-time updates when orders change status or new stock arrives.'},
];

const featureCards = [
  {title: 'Secure login', value: 'JWT auth across services'},
  {title: 'Fresh products', value: 'Search, filter, order'},
  {title: 'Service-ready', value: 'Spring Boot APIs and React UI'},
  {title: 'Local testing', value: 'Run with managed DB and Kafka without Docker'},
];

const roleCards = [
  {title: 'Farmers', text: 'Add produce, manage stock, and see orders in one dashboard.'},
  {title: 'Buyers', text: 'Search fresh produce, compare offers, and place purchase orders.'},
  {title: 'Admins', text: 'Extend the platform with new services or improve workflows.'},
];

const steps = [
  {icon: '👩‍🌾', title: 'Choose a role', description: 'Register as a farmer or buyer to unlock the right dashboard and marketplace experience.'},
  {icon: '🛒', title: 'Browse products', description: 'Search fresh produce from local farms and add items to your cart.'},
  {icon: '✅', title: 'Place order', description: 'Checkout securely and receive order updates as they move through the pipeline.'},
];

const screenCards = [
  {title: 'Farmer view', items: ['List products', 'Manage inventory', 'Track orders']},
  {title: 'Buyer marketplace', items: ['Search by category', 'Add to cart', 'Place purchase orders']},
  {title: 'Order status', items: ['View order history', 'Track deliveries', 'Confirm receipt']},
];

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow">KisanConnect</div>
          <h1 className="home-hero-title">Farm-to-table marketplace for Indian farmers and fresh buyers.</h1>
          <p>Buy, sell and manage fresh produce through a modern marketplace with farmer dashboards, buyer orders, product listings, notifications and secure login.</p>
          <div className="home-actions">
            <Link to="/register" className="home-button">Get Started</Link>
            <Link to="/login" className="home-cta">Login</Link>
          </div>
        </div>

        <div className="home-panel">
          <h3>Built for small farms and modern buyers</h3>
          <div className="home-panel-grid">
            {heroCards.map(card => (
              <div key={card.title} className="home-card">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="home-section">
          <span className="home-eyebrow">What is KisanConnect?</span>
          <h2>Modern marketplace for local farm produce</h2>
          <p>KisanConnect helps farmers and buyers connect directly, reducing middlemen and improving efficiency. It offers role-based dashboards, intuitive product discovery, and built-in order workflows.</p>
          <div className="home-grid">
            {featureCards.map(card => (
              <div key={card.title} className="home-card">
                <h3>{card.title}</h3>
                <p>{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-panel">
            <h3>Download and run locally</h3>
            <p>The website is fully runnable as a local frontend app. Create a project archive and launch the UI with the included instructions.</p>
            <a href="/kisanconnect-source.zip" download className="home-button">Download Project Package</a>
            <p className="home-footer-note">Use the included `.env.example` and local scripts to connect to managed or self-hosted services without Docker.</p>
          </div>
        </section>

        <section className="home-section">
          <div className="home-grid">
            {roleCards.map(card => (
              <div key={card.title} className="home-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2>How it works</h2>
          <div className="home-steps">
            {steps.map(step => (
              <div key={step.title} className="home-step">
                <div className="home-step-icon">{step.icon}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2>Site preview</h2>
          <div className="home-screenshots">
            {screenCards.map(card => (
              <div key={card.title} className="home-screen">
                <div className="home-screen-header">
                  <span className="home-dot" />
                  <span className="home-dot" />
                  <span className="home-dot" />
                </div>
                <div className="home-screen-body">
                  <h3 className="home-screen-title">{card.title}</h3>
                  <ul className="home-screen-list">
                    {card.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
