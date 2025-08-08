// pages/privacy.js

export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Privacy Policy for Auralytics
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Last Updated: August 7, 2025
        </p>

        <div className="space-y-6 text-gray-300">
          <p>
            We respect your privacy. This policy explains what data we collect and how we use it for the purpose of this hackathon project.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Data We Collect</h2>
            <p className="leading-relaxed">
              When you authenticate with your X account, we request read-only access to your public profile information (such as your username, profile picture, and follower count) and the text of your last 200 public tweets.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. How We Use Data</h2>
            <p className="leading-relaxed">
              Your public tweet data is sent to the Puch AI API for analysis to generate your "Aura Card." We do not store your tweets on our servers after the analysis is complete. We may store your public X user ID and your generated Aura Score to manage usage limits and display results.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Third Parties</h2>
            <p className="leading-relaxed">
              Your data is not sold or shared with any third-party advertisers. It is processed by the Puch AI API as a core requirement of the hackathon.
            </p>
          </div>

           <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Contact</h2>
            <p className="leading-relaxed">
              If you have any questions about this policy, please reach out to us via our main website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
