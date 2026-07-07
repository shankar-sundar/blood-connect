export default function PrivacyPage() {
  return (
    <div className="bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 sm:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-semibold text-red-600 mb-3 pb-4 border-b-2 border-red-100">
            Privacy Policy for BloodConnect
          </h1>
          <p className="text-sm text-[#86868b]">
            <strong>Effective Date:</strong> July 7, 2026
          </p>
        </div>

        {/* Introduction */}
        <p className="text-base leading-relaxed mb-8 text-[#6e6e73]">
          Welcome to BloodConnect. Your privacy is critically important to us. This Privacy Policy explains how we
          collect, use, and protect your information when you use our web application (
          <a href="https://blood-connect-chi.vercel.app" className="text-red-600 hover:underline">
            https://blood-connect-chi.vercel.app
          </a>
          ) and our associated WhatsApp Business messaging integration powered by the Meta WhatsApp Business Cloud API.
        </p>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            1. Information We Collect
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">
            To connect blood donors with hospitals efficiently, we collect the following personal information when you
            register:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-[#6e6e73]">
            <li>
              <strong>Account Data:</strong> First name, last name, email address, and authentication credentials.
            </li>
            <li>
              <strong>Contact Data:</strong> Mobile phone number, used to send emergency WhatsApp notifications.
            </li>
            <li>
              <strong>Health &amp; Medical Data:</strong> Blood group type (for donor-to-recipient compatibility
              matching).
            </li>
            <li>
              <strong>Location Data:</strong> City and PIN code to enable proximity-based emergency donor matching.
            </li>
            <li>
              <strong>Date of Birth &amp; Gender:</strong> Collected to verify eligibility criteria for blood donation.
            </li>
            <li>
              <strong>Role Type:</strong> Whether you are registering as an individual Donor or as a Hospital / Blood
              Bank representative.
            </li>
            <li>
              <strong>Messaging Interaction Data:</strong> When you respond to a WhatsApp notification (e.g., Accept,
              Decline, or Do Not Disturb), we record your response and the timestamp to manage blood request workflows.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            2. How We Use Your Data
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">
            We use the collected information exclusively to run the core functionalities of BloodConnect, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4 text-base text-[#6e6e73]">
            <li>
              Matching and notifying available donors based on blood type compatibility and proximity to urgent
              hospital requests.
            </li>
            <li>Sending emergency blood request notifications via WhatsApp using the Meta WhatsApp Business Cloud API.</li>
            <li>
              Sharing a confirmed donor's name and contact number with the requesting hospital when the donor accepts a
              blood request.
            </li>
            <li>Verifying and managing hospital, blood bank, and donor profiles.</li>
            <li>Honouring Do Not Disturb preferences by suppressing future notifications for opted-out donors.</li>
          </ul>
          <p className="text-base text-[#6e6e73]">
            We do not sell, rent, or trade your personal or health data to third-party advertising companies or data
            brokers.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            3. Data Storage and Security
          </h2>
          <p className="text-base text-[#6e6e73]">
            Your data is stored securely using industry-standard encryption protocols. We retain your information only
            for as long as your account remains active and is required to fulfil emergency blood request matching
            services. You may request deletion at any time (see Section 6 below).
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            4. WhatsApp &amp; Meta Platform Integration
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">
            BloodConnect uses the <strong>Meta WhatsApp Business Cloud API</strong> to send emergency blood request
            notifications directly to registered donors' WhatsApp numbers. By registering on BloodConnect and providing
            your mobile number, you consent to receiving WhatsApp messages from us regarding active blood requests in
            your area.
          </p>
          <p className="text-base mb-4 text-[#6e6e73]">
            These messages include interactive quick-reply buttons (Accept / Decline / Do Not Disturb). Your response
            is captured via a Meta Webhook and processed solely to manage the blood request workflow. We comply fully
            with the{' '}
            <a href="https://developers.facebook.com/terms/" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
              Meta Platform Terms
            </a>{' '}
            and the{' '}
            <a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
              WhatsApp Business Policy
            </a>
            .
          </p>
          <p className="text-base text-[#6e6e73]">
            We do not use Meta Platform data for any purpose beyond the core blood-matching functionality described in
            this policy.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            5. Third-Party Services
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">BloodConnect uses the following third-party services to operate the platform:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 text-base text-[#6e6e73]">
            <li>
              <strong>Meta (WhatsApp Business Cloud API)</strong> — for emergency donor notifications via WhatsApp.
            </li>
            <li>
              <strong>Vercel</strong> — for web application hosting.
            </li>
          </ul>
          <p className="text-base text-[#6e6e73]">
            Each of these services operates under its own privacy policy. We do not share your data with any other
            third parties.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            6. Your Rights (India DPDP Act, 2023)
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">
            As a user based in India, you have the following rights under the Digital Personal Data Protection (DPDP)
            Act, 2023:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-[#6e6e73]">
            <li>
              <strong>Right to Access:</strong> Request a summary of the personal data we hold about you.
            </li>
            <li>
              <strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong>Right to Erasure:</strong> Request complete deletion of your personal data from our systems.
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> Withdraw consent for WhatsApp notifications at any time by
              replying "Do Not Disturb" to any message or emailing us.
            </li>
          </ul>
        </section>

        {/* Deletion Box */}
        <section className="mb-10 bg-red-50 border-l-4 border-red-600 p-5 sm:p-6 rounded">
          <h3 className="text-xl font-semibold text-red-900 mb-4">7. User Data Deletion Instructions</h3>
          <p className="text-base text-red-900 mb-4">
            We respect your right to control your personal data. You can request the complete erasure of your account,
            blood group registry profile, and historical notification logs from our servers at any time.
          </p>
          <p className="text-base text-red-900">
            <strong>To request data deletion:</strong> Please send an email from your registered email address to{' '}
            <strong>bangalore.blood.allies@gmail.com</strong> with the subject line{' '}
            <em>&quot;Data Deletion Request&quot;</em>.
          </p>
          <p className="text-base text-red-900 mt-4">
            Our team will completely purge your data from our active databases and send you a confirmation email
            within 48 to 72 business hours.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            8. Changes to This Privacy Policy
          </h2>
          <p className="text-base text-[#6e6e73]">
            We may update this Privacy Policy from time to time. Any changes will be published directly on this webpage
            with an updated effective date. Continued use of BloodConnect after any changes constitutes your acceptance
            of the updated policy.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4 pb-2 border-b border-[#e5e7eb]">
            9. Contact Us
          </h2>
          <p className="text-base mb-4 text-[#6e6e73]">
            If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact
            us at:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base text-[#6e6e73]">
            <li>
              <strong>Email:</strong> bangalore.blood.allies@gmail.com
            </li>
            <li>
              <strong>Website:</strong>{' '}
              <a href="https://blood-connect-chi.vercel.app" className="text-red-600 hover:underline">
                https://blood-connect-chi.vercel.app
              </a>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#e5e7eb] text-center text-sm text-[#86868b]">
          <p>&copy; 2026 BloodConnect. Built to save lives. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
