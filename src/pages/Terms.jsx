import { useAuth } from '../auth/AuthContext'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import './Terms.css'

// Update this date whenever the terms change.
const LAST_UPDATED = 'November 26, 2026'

function Terms() {
  const { session } = useAuth()

  return (
    <>
      <Nav variant={session ? 'app' : 'public'} />

      <main className="container terms">
        <article className="terms__body">
          <header className="terms__header">
            <h1 className="terms__title">Terms and conditions</h1>
            <p className="terms__updated">Last updated {LAST_UPDATED}</p>
          </header>

          <p>
            These terms cover your use of Husky Exchange. By creating an account or using the site,
            you agree to them. They’re short, so please read them.
          </p>

          <section>
            <h2>1. What Husky Exchange is</h2>
            <p>
              Husky Exchange is a student project that helps Northeastern students buy, sell, and trade
              with each other. It is not an official Northeastern University service, and it isn’t
              run, endorsed, or supported by the university.
            </p>
            <p>
              We only connect buyers and sellers. We don’t own, sell, inspect, or ship anything listed
              here, we aren’t part of any sale, and we never handle payments.
            </p>
          </section>

          <section>
            <h2>2. Who can use it</h2>
            <ul>
              <li>You need a verified @northeastern.edu email address to create an account.</li>
              <li>One account per person. Use your real name, and keep your password to yourself.</li>
              <li>You’re responsible for everything done with your account.</li>
            </ul>
          </section>

          <section>
            <h2>3. Buying and selling</h2>
            <ul>
              <li>
                Exchanges happen in person at a public spot on campus, or online for things like
                tickets that can be transferred digitally.
              </li>
              <li>Never share your home address or dorm room number, and don’t ask others for theirs.</li>
              <li>
                Payment happens outside the site (cash, Venmo, Zelle, Cash App, or a trade). Check the
                item before you pay, and for online transfers, don’t pay until you’ve received it.
              </li>
              <li>
                Any deal is between the buyer and the seller. We can’t give refunds or settle
                disputes.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. What you can’t list</h2>
            <ul>
              <li>Anything illegal, stolen, counterfeit, or recalled.</li>
              <li>Weapons, drugs, alcohol, tobacco, vapes, or prescription medication.</li>
              <li>Homework, exam answers, or other work that breaks academic integrity rules.</li>
              <li>Live animals.</li>
              <li>Tickets the event doesn’t allow you to resell.</li>
              <li>Anything that breaks Northeastern’s student code of conduct or housing rules.</li>
            </ul>
          </section>

          <section>
            <h2>5. Your listings and how you act</h2>
            <ul>
              <li>Describe items honestly, with your own photos, and keep the status up to date.</li>
              <li>No scams, fake listings, spam, harassment, or hateful content.</li>
              <li>
                You keep ownership of what you post. You let us show it on Husky Exchange so other
                students can see your listings.
              </li>
              <li>
                We may remove listings or suspend accounts that break these terms, without notice.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Your account and data</h2>
            <ul>
              <li>
                We store your email, name, profile details, listings, photos, and messages so the site
                works. We don’t sell your information.
              </li>
              <li>
                Signed-in students can see your name, profile photo, and listings. Visitors who aren’t
                signed in only see basic listing info.
              </li>
              <li>
                You can delete your account at any time from your profile. That deletes your profile,
                listings, photos, and messages. Reviews you wrote stay, without your name.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. No guarantees</h2>
            <p>
              Husky Exchange is provided as is. We don’t guarantee that listings are accurate, that
              other users are who they say they are, or that the site will always be available. We
              aren’t responsible for items, payments, meetups, or losses that come from using the
              site. Use your judgment, and meet somewhere public.
            </p>
          </section>

          <section>
            <h2>8. Changes to these terms</h2>
            <p>
              We may update these terms. When we do, we’ll change the date at the top of this page.
              If you keep using Husky Exchange after that, you agree to the new terms.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </>
  )
}

export default Terms
