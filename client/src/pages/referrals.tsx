import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Users, UserCheck, Trophy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  signedUpReferrals: number;
  convertedReferrals: number;
  referrals: Array<{
    id: string;
    email?: string;
    status: string;
    shareMethod?: string;
    clickedAt?: string;
    signedUpAt?: string;
    convertedAt?: string;
    createdAt: string;
  }>;
}

interface ReferralCode {
  referralCode: string;
  shareableLink: string;
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailToShare, setEmailToShare] = useState("");

  // Fetch user's referral code and link
  const { data: referralData, isLoading: isLoadingCode } = useQuery<ReferralCode>({
    queryKey: ['/api/referral-code', user?.id],
    enabled: !!user?.id,
  });

  // Fetch referral stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<ReferralStats>({
    queryKey: ['/api/referral-stats', user?.id],
    enabled: !!user?.id,
  });

  // Copy referral link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Share via social media or email
  const shareViaMethod = (method: 'email' | 'twitter' | 'linkedin') => {
    if (!referralData) return;
    
    const message = "Discover your path to 150+ years with Thanalytica - AI-powered longevity health assessment";
    const url = referralData.shareableLink;
    
    switch (method) {
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message} ${url}`)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'signed_up': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'converted': return 'bg-medical-green/10 text-medical-green dark:bg-medical-green/20';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Users className="w-4 h-4" />;
      case 'signed_up': return <UserCheck className="w-4 h-4" />;
      case 'converted': return <Trophy className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (!user) {
    return <div>Please log in to view referrals</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-white via-gray-50/30 to-medical-green/5 dark:from-gray-950 dark:via-gray-900 dark:to-medical-green/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Referral Program
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share Thanalytica with friends and unlock premium features together
          </p>
        </div>

        {/* Referral Program Benefits */}
        <Card className="mb-8 border-medical-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-medical-green" />
              Program Benefits
            </CardTitle>
            <CardDescription>
              Rewards for sharing the future of longevity health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-medical-green/5 dark:bg-medical-green/10 rounded-lg">
                <h3 className="font-semibold text-medical-green mb-2">For You</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Premium features for 1 month when someone signs up using your link
                </p>
              </div>
              <div className="text-center p-4 bg-trust-blue/5 dark:bg-trust-blue/10 rounded-lg">
                <h3 className="font-semibold text-trust-blue mb-2">For Your Friend</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed longevity report with advanced health insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-medical-green">
                {stats?.totalReferrals ?? 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingReferrals ?? 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-trust-blue">
                {stats?.signedUpReferrals ?? 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signed Up</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-vitality-gold">
                {stats?.convertedReferrals ?? 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Converted</p>
            </CardContent>
          </Card>
        </div>

        {/* Share Referral Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Referral Link
            </CardTitle>
            <CardDescription>
              Your unique link: <code className="text-medical-green">{referralData?.referralCode}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralData?.shareableLink || "Loading..."}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => referralData && copyToClipboard(referralData.shareableLink)}
                disabled={!referralData}
                size="icon"
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => shareViaMethod('email')}
                variant="outline"
                size="sm"
                disabled={!referralData}
              >
                Email
              </Button>
              <Button
                onClick={() => shareViaMethod('twitter')}
                variant="outline"
                size="sm"
                disabled={!referralData}
              >
                Twitter
              </Button>
              <Button
                onClick={() => shareViaMethod('linkedin')}
                variant="outline"
                size="sm"
                disabled={!referralData}
              >
                LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>
              Track the progress of your referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.referrals && stats.referrals.length > 0 ? (
              <div className="space-y-3">
                {stats.referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(referral.status)}
                      <div>
                        <p className="font-medium">
                          {referral.email || 'Anonymous referral'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Shared on {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(referral.status)}>
                      {referral.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No referrals yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Share your referral link to start earning rewards!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}