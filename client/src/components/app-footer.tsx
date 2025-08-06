import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Heart, Shield, Mail } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-medical-green" />
              <h3 className="text-lg font-semibold text-gray-900">Thanalytica</h3>
            </div>
            <p className="text-sm text-gray-600">
              AI-powered longevity health assessment platform for extending your healthy lifespan.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Platform</h4>
            <div className="space-y-2">
              <Link href="/dashboard" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Dashboard
              </Link>
              <Link href="/assessment" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Health Assessment
              </Link>
              <Link href="/wearables" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Wearables
              </Link>
              <Link href="/recommendations" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Recommendations
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Company</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                About Us
              </Link>
              <Link href="/referrals" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Referral Program
              </Link>
              <a href="mailto:support@thanalytica.com" className="block text-sm text-gray-600 hover:text-medical-green transition-colors">
                Support
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Legal</h4>
            <div className="space-y-2">
              <Link href="/privacy-policy" className="flex items-center text-sm text-gray-600 hover:text-medical-green transition-colors">
                <Shield className="h-4 w-4 mr-1" />
                Privacy Policy
              </Link>
              <a href="mailto:privacy@thanalytica.com" className="flex items-center text-sm text-gray-600 hover:text-medical-green transition-colors">
                <Mail className="h-4 w-4 mr-1" />
                Privacy Contact
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Thanalytica. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Empowering longevity through AI-driven health insights
          </p>
        </div>
      </div>
    </footer>
  );
}