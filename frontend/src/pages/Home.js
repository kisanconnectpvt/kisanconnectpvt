import React from 'react';
import {Link} from 'react-router-dom';
import './Home.css';

const heroCards = [
  {title: 'Straight from the farm', desc: 'Discover seasonal produce from growers near you.'},
  {title: 'Fair prices, clear choices', desc: 'Compare fresh picks and choose what suits your table.'},
  {title: 'A better harvest ahead', desc: 'Help local farms reach more homes and grow their business.'},
];

const benefitCards = [
  {icon: '🍅', title: 'Picked with care', value: 'Fresh produce from independent farmers.'},
  {icon: '🤝', title: 'Closer connections', value: 'Buy directly and support local growers.'},
  {icon: '🧺', title: 'Easy to shop', value: 'Find everyday essentials and seasonal favorites.'},
  {icon: '🌱', title: 'Room to grow', value: 'A welcoming place for farms of every size.'},
];

const roleCards = [
  {title: 'For farmers', text: 'Showcase your harvest, reach new customers, and keep track of incoming orders.', action: 'Join as a farmer', to: '/register'},
  {title: 'For buyers', text: 'Fill your basket with fresh finds and discover the people who grow your food.', action: 'Explore the market', to: '/products'},
];

const steps = [
  {icon: '👩‍🌾', title: 'Choose a role', description: 'Register as a farmer or buyer to unlock the right dashboard and marketplace experience.'},
  {icon: '🛒', title: 'Browse products', description: 'Search fresh produce from local farms and add items to your cart.'},
  {icon: '✅', title: 'Place order', description: 'Checkout securely and receive order updates as they move through the pipeline.'},
];

const categories = [
  {title: 'Vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=720&q=85', alt: 'A colorful basket of fresh vegetables'},
  {title: 'Fruit', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=720&q=85', alt: 'Fresh seasonal fruit'},
  {title: 'Grains', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=720&q=85', alt: 'Golden grain ready for harvest'},
];

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow">KisanConnect</div>
          <h1 className="home-hero-title">Good food begins with good connections.</h1>
          <p>Meet the farmers behind your food. Shop fresh harvests, support local farms, and bring a little more goodness to your table.</p>
          <div className="home-actions">
            <Link to="/products" className="home-button">Explore fresh produce</Link>
            <Link to="/register" className="home-cta">Grow with us</Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=90" alt="Sunlit green fields stretching toward the horizon" />
          <div className="home-image-caption"><span>Grown close. Shared with care.</span><span>🌿</span></div>
        </div>
        <div className="home-panel home-hero-panel">
          <h3>Fresh from the people who grow it</h3>
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
          <span className="home-eyebrow">The good stuff, closer</span>
          <h2>Good things grow when we connect</h2>
          <p className="home-section-intro">A more personal way to discover fresh food and support the farms that bring it to life.</p>
          <div className="home-grid home-benefit-grid">
            {benefitCards.map(card => (
              <div key={card.title} className="home-card home-benefit-card">
                <span className="home-benefit-icon" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section home-roles-section">
          <span className="home-eyebrow">Made for your side of the table</span>
          <h2>There’s a place for you here</h2>
          <div className="home-grid home-role-grid">
            {roleCards.map(card => (
              <div key={card.title} className="home-card home-role-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <Link to={card.to} className="home-text-link">{card.action}<span aria-hidden="true"> ↗</span></Link>
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

        <section className="home-section home-category-section">
          <span className="home-eyebrow">From nearby fields</span>
          <h2>A little inspiration for your basket</h2>
          <div className="home-category-grid">
            {categories.map(category => (
              <Link to="/products" className="home-category" key={category.title}>
                <img src={category.image} alt={category.alt} loading="lazy" />
                <span>{category.title}<span aria-hidden="true"> →</span></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
