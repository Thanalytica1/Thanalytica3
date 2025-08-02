import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Target, ArrowRight, Calendar, TrendingUp, Shield } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center mb-6">
          <Heart className="text-medical-green h-16 w-16 mr-4" />
          <h1 className="text-4xl font-bold text-professional-slate">Our Mission</h1>
        </div>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
          Thanalytica exists to democratize longevity science and empower individuals to reach their full lifespan potential of 150 years through evidence-based health optimization.
        </p>
      </div>

      {/* Vision Statement */}
      <Card className="bg-gradient-to-r from-medical-green to-trust-blue text-white mb-12">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">The 150-Year Vision</h2>
              <p className="text-lg opacity-90 leading-relaxed">
                We believe the current human lifespan is just the beginning. With advancing medical technologies, 
                genetic therapies, and preventive care, reaching 150 years of healthy, vibrant life is not just 
                possible—it's inevitable for those who prepare today.
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">150</div>
              <div className="text-xl opacity-75">Years of Vitality</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-professional-slate text-center mb-12">Why Longevity Planning Matters Now</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-medical-green bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="text-medical-green text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Time is Your Greatest Asset</h3>
              <p className="text-gray-600">
                The decisions you make today about sleep, exercise, nutrition, and stress management compound over decades. 
                Starting optimization early can add 20-30 healthy years to your life.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-trust-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-trust-blue text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Medical Breakthroughs Accelerating</h3>
              <p className="text-gray-600">
                Gene therapy, regenerative medicine, and AI-driven personalized treatments are advancing rapidly. 
                Those who maintain their health today will benefit most from tomorrow's innovations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-vitality-gold bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-vitality-gold text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Prevention Over Treatment</h3>
              <p className="text-gray-600">
                Preventing age-related diseases is exponentially more effective and affordable than treating them. 
                Our platform helps you identify and address risks decades before they become problems.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How We Help */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-professional-slate text-center mb-12">How Thanalytica Transforms Your Future</h2>
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-medical-green rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1">1</div>
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Comprehensive Health Assessment</h3>
              <p className="text-gray-600">
                Our AI analyzes your lifestyle, genetics, environment, and health history to calculate your biological age 
                and longevity trajectory with scientific precision.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-trust-blue rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1">2</div>
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Personalized Optimization Protocol</h3>
              <p className="text-gray-600">
                Receive evidence-based recommendations tailored to your unique profile. From exercise protocols to 
                nutrition strategies, every suggestion is designed to maximize your longevity potential.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-vitality-gold rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1">3</div>
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Real-Time Impact Simulation</h3>
              <p className="text-gray-600">
                Use our Health Decision Simulator to see how lifestyle changes affect your projected lifespan. 
                Understand the long-term impact of every health decision you make.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-gentle-coral rounded-full flex items-center justify-center text-white font-bold mr-4 mt-1">4</div>
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Continuous Monitoring & Adaptation</h3>
              <p className="text-gray-600">
                As longevity science advances and your health evolves, our platform adapts your optimization strategy 
                to ensure you're always on the cutting edge of healthy aging.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Foundation */}
      <Card className="bg-clinical-white border border-gray-200 mb-12">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-professional-slate mb-6 text-center">Built on Rigorous Science</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Research-Backed Methodologies</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Blue Zone lifestyle analysis</li>
                <li>• Epigenetic aging markers</li>
                <li>• Cardiovascular risk modeling</li>
                <li>• Metabolic health optimization</li>
                <li>• Stress impact quantification</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Continuous Algorithm Improvement</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Latest longevity research integration</li>
                <li>• Machine learning optimization</li>
                <li>• Population health data analysis</li>
                <li>• Clinical outcome validation</li>
                <li>• Expert medical review board</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-professional-slate mb-6">Start Your Journey to 150</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Every day you delay is a day of potential vitality lost. Join thousands who are already optimizing 
          for a longer, healthier future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/assessment">
            <Button className="bg-medical-green text-white px-8 py-4 text-lg font-semibold hover:bg-medical-green/90">
              Begin Your Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/simulator">
            <Button variant="outline" className="border-2 border-trust-blue text-trust-blue px-8 py-4 text-lg font-semibold hover:bg-trust-blue hover:text-white">
              Try the Simulator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}