import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, FileText } from "lucide-react";
import { useEffect } from "react";

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // SEO and metadata
  useEffect(() => {
    document.title = "Privacy Policy - Thanalytica | Health Data Protection";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Thanalytica privacy policy explaining how we protect your health data from wearable devices including Garmin, Oura, Whoop, and Apple Health. Learn about our data practices and your rights.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Thanalytica privacy policy explaining how we protect your health data from wearable devices including Garmin, Oura, Whoop, and Apple Health. Learn about our data practices and your rights.';
      document.head.appendChild(meta);
    }

    // Add Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Privacy Policy - Thanalytica');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Privacy Policy - Thanalytica';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Learn how Thanalytica protects your health data and privacy rights for wearable device integrations.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Learn how Thanalytica protects your health data and privacy rights for wearable device integrations.';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-green/5 via-white to-trust-blue/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-medical-green mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy for Thanalytica</h1>
          </div>
          <p className="text-gray-600 mb-2">Effective Date: {currentDate}</p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            At Thanalytica, we are committed to protecting your privacy and securing your health data. 
            This policy explains how we collect, use, and safeguard information from your wearable devices 
            and personal health tracking to provide you with personalized longevity insights.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Section 1 - Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 text-medical-green mr-2" />
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>We collect the following types of information to provide our health forecasting services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Personal Information:</strong> Name, email address, and account credentials</li>
                  <li><strong>Health & Activity Data:</strong> Synchronized data from Garmin Connect IQ, Oura Ring, Whoop, and Apple Health integrations including:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Heart rate, HRV, and sleep patterns</li>
                      <li>Physical activity, steps, and exercise data</li>
                      <li>Recovery metrics and strain scores</li>
                      <li>Body temperature and readiness indicators</li>
                    </ul>
                  </li>
                  <li><strong>Self-Reported Data:</strong> Wellness entries including stress levels, mood tracking, sleep quality, and journal entries</li>
                  <li><strong>Technical Information:</strong> Device identifiers, IP addresses, and usage logs</li>
                  <li><strong>Analytics Data:</strong> Cookies and tracking technologies for platform improvement</li>
                  <li><strong>Location Data:</strong> When enabled by your device settings</li>
                </ul>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>Age Requirement:</strong> You must be 13 years or older to use Thanalytica. We do not knowingly collect data from children under 13.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 2 - How We Use Your Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Data</h2>
              <div className="space-y-4 text-gray-700">
                <p>Your data is used exclusively to provide personalized health insights:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Personalized Health Insights:</strong> Generate customized recommendations based on your unique health profile</li>
                  <li><strong>Biological Age Calculations:</strong> Provide longevity projections and biological age assessments</li>
                  <li><strong>Wellness Trend Tracking:</strong> Monitor your health metrics over time to identify patterns and improvements</li>
                  <li><strong>Platform Enhancement:</strong> Improve our algorithms and user experience through aggregated usage analysis</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 3 - How We Share Your Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Share Your Data</h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-medical-green/10 p-4 rounded-lg border border-medical-green/20">
                  <p className="font-semibold text-medical-green">We do not sell your personal health data to third parties.</p>
                </div>
                <p>We may share your information only in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> Firebase, Google Cloud, and other trusted platforms that help us operate Thanalytica</li>
                  <li><strong>Wearable Platforms:</strong> Authorized data synchronization with Garmin, Oura, Whoop, and Apple Health APIs</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
                  <li><strong>International Transfers:</strong> Data may be processed in countries with adequate data protection standards</li>
                  <li><strong>Research Purposes:</strong> Aggregated and anonymized data for health research and population studies</li>
                  <li><strong>Third-Party Agreements:</strong> All data sharing is governed by strict data protection agreements</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 4 - Your Rights and Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Your Rights and Choices</h2>
              <div className="space-y-4 text-gray-700">
                <p>You have complete control over your health data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access & Correction:</strong> Request access to or correction of your personal information</li>
                  <li><strong>Data Deletion:</strong> Request complete removal of your data from our systems</li>
                  <li><strong>Wearable Sync Control:</strong> Revoke authorization for any connected wearable device at any time</li>
                  <li><strong>Garmin Connect Management:</strong> Manage permissions directly through your Garmin Connect IQ settings</li>
                  <li><strong>Sync Clarification:</strong> Revoking access stops future data collection but may retain historical data unless deletion is requested</li>
                  <li><strong>Account Closure:</strong> Complete account deletion removes all associated data within 30 days</li>
                </ul>
                <p className="text-sm">
                  For data requests, contact us at: <a href="mailto:support@thanalytica.com" className="text-medical-green hover:underline font-medium">support@thanalytica.com</a>
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 5 - Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>We implement industry-leading security measures:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>AES-256 Encryption:</strong> All data is encrypted both in transit and at rest</li>
                  <li><strong>Access Controls:</strong> Secure authentication and role-based access management</li>
                  <li><strong>Audit Logs:</strong> Comprehensive security monitoring and access logging</li>
                  <li><strong>Compliance Standards:</strong> GDPR and HIPAA-aligned data protection practices</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 6 - Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Changes to This Policy</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Update Notifications:</strong> We will notify you of material changes via email or platform notification</li>
                  <li><strong>Continued Use:</strong> Continued use of Thanalytica after policy updates constitutes acceptance of changes</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 7 - Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 text-medical-green mr-2" />
                7. Contact Information
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>For privacy-related questions or concerns:</p>
                <p className="text-lg">
                  <a href="mailto:privacy@thanalytica.com" className="text-medical-green hover:underline font-medium">
                    Jonah@thanalytica.com
                  </a>
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 8 - Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Jurisdiction:</strong> This policy is governed by the laws of [State/Province to be specified]</li>
                  <li><strong>EU Users:</strong> Users in the European Union retain all rights under GDPR regulations</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 9 - Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Active Accounts:</strong> Data is retained while your account remains active and for legitimate business purposes</li>
                  <li><strong>Account Closure:</strong> Data is automatically deleted within 30 days of account closure</li>
                  <li><strong>Immediate Deletion:</strong> Data can be deleted immediately upon explicit user request</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>This privacy policy is part of our commitment to transparency and your health data security.</p>
          <p className="mt-2">
            Questions? Contact us at <a href="mailto:support@thanalytica.com" className="text-medical-green hover:underline">Jonah@thanalytica.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}