import { Link } from 'react-router'

import Footer from '../components/Footer'
import ListingCard from '../components/ListingCard'
import Nav from '../components/Nav'
import SearchBar from '../components/SearchBar'
import { sampleListings } from '../data/sampleListings'
import './Landing.css'

const HERO_CATEGORIES = ['Textbooks', 'Furniture', 'Electronics', 'Tickets', 'Bikes']

const STEPS = [
  {
    title: 'Sign up with your school email',
    body: 'Accounts use an @northeastern.edu address, so everyone here is part of the community.',
  },
  {
    title: 'Post or browse listings',
    body: 'Add photos, a price and how you want to be paid. Or mark it open to trade.',
  },
  {
    title: 'Message and meet up',
    body: 'Chat in the app and meet somewhere on campus to make the exchange.',
  },
]

function Landing() {
  return (
    <>
      <Nav variant="public" />

      <main>
        <section className="hero">
          <div className="container hero__inner">
            <h1 className="hero__title">
              Find what you need,
              <br />
              from people on campus.
            </h1>
            <p className="hero__lede">
              Textbooks, furniture, electronics and more from people at Northeastern. Sign up with
              your school email to buy or sell.
            </p>
            <SearchBar size="large" />
            <div className="hero__chips">
              {HERO_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  className="chip"
                  to={`/browse?category=${encodeURIComponent(category)}`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="recent">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 className="section-title">Recently listed</h2>
                <p className="section-subtitle">New items from students near you</p>
              </div>
              <Link className="section-link" to="/browse">
                See all →
              </Link>
            </div>
            <div className="listing-grid">
              {sampleListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>

        <section className="how" id="how-it-works">
          <div className="container">
            <h2 className="section-title">How it works</h2>
            <ol className="how__steps">
              {STEPS.map((step, index) => (
                <li key={step.title} className="how__step">
                  <span className="how__number">{index + 1}</span>
                  <h3 className="how__title">{step.title}</h3>
                  <p className="how__body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sell">
          <div className="container">
            <div className="sell__card">
              <div>
                <h2 className="sell__title">Have something to sell?</h2>
                <p className="sell__body">Post a listing in a couple of minutes. No fees.</p>
              </div>
              <Link className="btn btn--primary" to="/sell">
                List an item
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Landing
